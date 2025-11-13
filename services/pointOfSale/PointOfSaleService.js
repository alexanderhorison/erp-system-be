const { codeGenerator } = require("../../helpers/codeGenerator");
const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Warehouse_Product,
  Master_Product,
  Master_Company,
  Master_Unit,
  Master_Product_Price,
  Master_Warehouse_Rack,
  Pos_Transaction_Detail,
  Master_Warehouse,
  Pos_Payment_Type,
  Pos_Transaction_Payment_History,
  Pos_Transaction,
  Stock_Adjustment_History,
  Master_User,
  Master_Role,
  Master_Customer,
  Master_Rank,
  Dashboard_Summary_Pos_Customer
} = require("../../models");
const { Op } = require("sequelize");
const ConfigService = require("../config/configService");
const { formatDate, formatTimeSecond } = require("../../helpers/formatDate");
const { addLine, justifyLeft, justifyRight, addSpace, virtualConsoleLogPos } = require("../../helpers/posFunction");
const { priceFormat, formatPricePosWithCurrency } = require("../../helpers/priceFormat");
const ExportPointOfSaleService = require("../export/ExportPointOfSaleService");
const transporter = require("../../helpers/emailConfig");
const fs = require("fs/promises");


class PointOfSaleService {
  static async addOrRemoveFavorite(data) {
    try {
      const { productId, warehouseId, isFavorite } = data;

      const warehouseProduct = await Warehouse_Product.findOne({
        where: {
          productId,
          warehouseId,
        },
      });

      if (!warehouseProduct) {
        throwValidation(400, `Produk tidak ditemukan`);
      }

      // Favorite true add to favorit
      if (isFavorite) {
        await Warehouse_Product.update(
          {
            isFavorite: true,
          },
          {
            where: {
              productId,
              warehouseId,
            },
          }
        );
      } else {
        // remove from favorite
        await Warehouse_Product.update(
          {
            isFavorite: false,
          },
          {
            where: {
              productId,
              warehouseId,
            },
          }
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
  static async getPointOfSaleProductByWarehouse({ warehouseId }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId, // Filter by warehouseId
        },
        attributes: [
          "productId", // Only select productId to make it distinct
          [sq.fn("MIN", sq.col("Warehouse_Product.id")), "productWarehouseId"], // Use MIN(id) to get one record per productId
          "isFavorite",
        ],
        include: [
          {
            model: Master_Product,
            attributes: ["name", "companyId", "categoryId", "typeId"],
            include: [
              {
                model: Master_Company,
                attributes: ["name"],
              },
            ],
          },
        ],
        // order: [['productId', 'ASC']],
        group: [
          "productId", // Group by productId only
          "Master_Product.id", // Include required fields for joins
          "isFavorite",
          "Master_Product->Master_Company.id",
        ],
      });

      const formatData = data.map((item, index) => ({
        id: item.get("productWarehouseId"),
        isFavorite: item.isFavorite,
        productName: item.Master_Product.name,
        companyName: item.Master_Product.Master_Company.name,
        companyId: item.Master_Product.companyId,
        productId: item.productId,
        categoryId: item.Master_Product.categoryId,
        typeId: item.Master_Product.typeId,
      }));

      return formatData;
    } catch (error) {
      throw error;
    }
  }

  static async getAllProductByProductId({ warehouseId, productId }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId, // Filter by warehouseId
          productId,
        },
        include: [
          {
            model: Master_Product,
            attributes: ["name", "companyId"],
            include: [
              {
                model: Master_Company,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
          {
            model: Master_Warehouse_Rack,
            attributes: ["name"],
          },
        ],
      });

      // Extract productId and unitId combinations from `data`
      const productUnitPairs = data.map((item) => ({
        productId: item.productId,
        unitId: item.unitId,
      }));

      // Fetch all relevant prices in one query
      const prices = await Master_Product_Price.findAll({
        where: {
          [Op.or]: productUnitPairs, // Sequelize's `Op.or` for array of conditions
        },
      });

      // Build a map for quick price lookup
      const priceMap = {};
      prices.forEach((price) => {
        priceMap[`${price.productId}_${price.unitId}`] = price.basePricePos;
      });

      // Format the data using the pre-fetched price map
      const formatData = data.map((item) => {
        const basePrice = priceMap[`${item.productId}_${item.unitId}`] || 0;

        return {
          id: item.id,
          isFavorite: item.isFavorite,
          productName: item.Master_Product.name,
          companyName: item.Master_Product.Master_Company.name,
          companyId: item.Master_Product.companyId,
          productId: item.productId,
          unitName: item.Master_Unit.name,
          rackName: item.Master_Warehouse_Rack.name,
          quantity: item.quantity,
          basePrice,
        };
      });

      return formatData;
    } catch (error) {
      throw error;
    }
  }

  static async createPointOfSale({ data, user }) {
    const transaction = await sq.transaction();
    try {
      if ((Number(data.grandTotal) - Number(data.totalPayment) > 0) && !data.customerId) {
        throwValidation(400, "Customer harus diisi jika terdapat sisa hutang");
      }

      const generateCode = await codeGenerator(8, "POS");

      let totalQuantity = 0;
      let totalItems = 0;
      // Count total quantity
      data.listProduct?.forEach((item) => {
        totalQuantity += item.quantity;
      });

      // Count total item
      data.listProduct?.forEach((item) => {
        totalItems += 1;
      });

      // create point of sale
      const createdPointOfSale = await Pos_Transaction.create(
        {
          customerId: data.customerId,
          code: generateCode,
          subTotal: data.subTotal,
          totalDiscount: data.totalDiscount,
          grandTotal: data.grandTotal,
          totalPayment: data.totalPayment,
          notes: data.notes,
          createdBy: user.id,
          updatedBy: user.id,
          warehouseId: data.warehouseId,
          // Saat ini statusnya langsung paid
          status: "PAID",
          totalQuantity: totalQuantity,
          totalItems: totalItems,
          lastDebt: data.totalDebt || 0
        },
        { transaction }
      );

      const createPosProducts = [];
      const listProduct = data?.listProduct;

      let totalHargaBarangWithoutDebt = 0;

      for (const item of listProduct) {
        // Jika produk memiliki warehouseProductId
        if (item.warehouseProductId) {
          const warehouseProduct = await Warehouse_Product.findOne({
            where: {
              id: item.warehouseProductId,
            },
            include: [
              {
                model: Master_Product,
                attributes: ["name"],
              },
              {
                model: Master_Unit,
                attributes: ["name"],
              },
              {
                model: Master_Warehouse,
                attributes: ["name"],
              },
            ],
            transaction,
          });

          if (!warehouseProduct) {
            throwValidation(
              400,
              "Salah satu product warehouse tidak ditemukan"
            );
          }

          // Lakukan pengecekan stock quantity dengan stok di product warehouse apakah cukup
          if (warehouseProduct.quantity < item.quantity) {
            const productName =
              warehouseProduct.Master_Product?.name || "Produk";
            const unitName = warehouseProduct.Master_Unit?.name || "unit";
            throwValidation(
              400,
              `Stok product ${productName} - ${unitName} kurang, saat ini berjumlah ${warehouseProduct.quantity}`
            );
          }

          const newWarehouseQuantity =
            warehouseProduct?.quantity - item?.quantity;

          // Kurangi stok product di warehouse
          await Warehouse_Product.update(
            {
              quantity: newWarehouseQuantity,
            },
            {
              where: {
                id: item?.warehouseProductId,
              },
              transaction,
            }
          );
          // catat stock adjustment histories
          await Stock_Adjustment_History.create(
            {
              productWarehouseId: item?.warehouseProductId,
              quantity: item?.quantity,
              adjustmentType: "MINUS",
              warehouseId: warehouseProduct?.warehouseId,
              userId: user?.id,
              info: "POINT OF SALE",
              posTransactionId: createdPointOfSale?.id,
              lastQuantity: newWarehouseQuantity,
            },
            { transaction }
          );
        }
        // calculated total harga barang tanpa hutang
        if (!item.isDebt) {
          totalHargaBarangWithoutDebt += item.subTotal;
        }

        // push pos products
        createPosProducts.push({
          title: item.title || "",
          posTransactionId: createdPointOfSale.id,
          warehouseProductId: item.warehouseProductId ?? null,
          price: item.price,
          quantity: item.quantity,
          subTotal: item.subTotal,
          notes: item.notes || "",
        });
      }

      await Pos_Transaction_Detail.bulkCreate(createPosProducts, {
        transaction,
      });

      // Create Pos Payment
      await Pos_Transaction_Payment_History.create(
        {
          posTransactionId: createdPointOfSale.id,
          total: data.totalPayment,
          posPaymentTypeId: data.paymentTypeId,
          createdBy: user.id,
          updatedBy: user.id,
        },
        { transaction }
      );

      // Update Dashboard Summary Pos Customer
      if (data?.customerId) {
        const findExisting = await Dashboard_Summary_Pos_Customer.findOne({
          where: {
            customerId: data.customerId
          },
          transaction
        });

        const grandTotal = Number(data.grandTotal) || 0;
        const totalPayment = Number(data.totalPayment) || 0;
        // Hitung sisa hutang
        let amountDebt = totalHargaBarangWithoutDebt + data.totalDebt - totalPayment;
        // Jika hasil negatif atau 0, berarti tidak ada hutang
        if (amountDebt <= 0) amountDebt = 0;

        // Hitung jumlah yang dibayar
        const paidAmount = totalPayment >= grandTotal ? grandTotal : totalPayment;


        if (findExisting) {
          // Jika ada, update
          await Dashboard_Summary_Pos_Customer.update({
            totalPos: Number(findExisting.totalPos) + 1,
            totalAmountPos: Number(findExisting.totalAmountPos) + Number(totalHargaBarangWithoutDebt),
            totalAmountPaidPos: Number(findExisting.totalAmountPaidPos) + Number(paidAmount),
            totalAmountDebtPos: Number(amountDebt)
          }, {
            where: { id: findExisting.id },
            transaction
          });
        } else {
          // Jika tidak ada, buat baru
          await Dashboard_Summary_Pos_Customer.create({
            customerId: data.customerId,
            totalPos: 1,
            totalAmountPos: grandTotal,
            totalAmountPaidPos: paidAmount,
            totalAmountDebtPos: amountDebt
          }, { transaction });
        }
      }

      await transaction.commit();
      return {
        id: createdPointOfSale.id,
        code: createdPointOfSale.code,
        status: createdPointOfSale.status,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getPaymentType() {
    try {
      const paymentTypes = await Pos_Payment_Type.findAll({
        attributes: ["id", "label", "code", "icon", "description"],
      });

      return paymentTypes;
    } catch (error) {
      throw error;
    }
  }

  static async getAllPointOfSaleByWarehouseId(warehouseId, userId) {
    try {
      const getAllPosTransaction = await Pos_Transaction.findAll({
        where: {
          warehouseId,
          createdBy: userId
        },
        include: [
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_Warehouse,
            attributes: ["name"],
            paranoid: true,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const all = getAllPosTransaction.map((item) => {
        return {
          id: item.id,
          code: item.code,
          subTotal: item.subTotal,
          totalDiscount: item.totalDiscount,
          grandTotal: item.grandTotal,
          totalPayment: item.totalPayment,
          notes: item.notes,
          status: item.status,
          createdAt: item.createdAt,
          dateCreated: formatDate(item?.createdAt),
          creator: {
            name: item?.creator?.name,
            role: item?.creator?.Master_Role?.name,
          },
          warehouseId: item?.warehouseId ?? null,
          warehouseName: item?.Master_Warehouse?.name ?? "",
          totalQuantity: item?.totalQuantity,
          totalItems: item?.totalItems,
        };
      });

      return all;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailPointOfSaleByCode(code) {
    try {
      const detail = await Pos_Transaction.findOne({
        where: { code: code },
        include: [
          {
            model: Master_Customer,
            include: [
              {
                model: Master_Rank,
                attributes: ["name", "level"],
              },
            ],
            paranoid: true,
          },
          {
            model: Master_Warehouse,
            attributes: ["name"],
            paranoid: true,
          },
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
        ],
      });

      if (!detail) {
        throwValidation(400, "Data tidak ditemukan");
      }

      const products = await Pos_Transaction_Detail.findAll({
        where: { posTransactionId: detail.id },
        include: [
          {
            model: Warehouse_Product,
            paranoid: false,
            include: [
              {
                model: Master_Product,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Master_Company,
                    attributes: ["id", "name"],
                  },
                ],
              },
              { model: Master_Unit, attributes: ["id", "name"] },
              { model: Master_Warehouse_Rack, attributes: ["id", "name"] },
              { model: Master_Warehouse, attributes: ["id", "name"] },
            ],
          },
        ],
      });

      const listProduct = products.map((item) => {
        return {
          id: item?.id,
          title: item?.title,
          price: item?.price,
          quantity: item?.quantity,
          subTotal: item?.subTotal,
          notes: item?.notes,
          unitName: item?.Warehouse_Product?.Master_Unit?.name ?? "",
          productName: item?.Warehouse_Product?.Master_Product?.name ?? "",
          companyName:
            item?.Warehouse_Product?.Master_Product?.Master_Company?.name ?? "",
          rackName: item?.Warehouse_Product?.Master_Warehouse_Rack?.name ?? "",
          warehouseProductId: item?.Warehouse_Product?.id ?? "",
          warehouseName: item?.Warehouse_Product?.Master_Warehouse?.name ?? "",
          warehouseId: item?.Warehouse_Product?.Master_Warehouse?.id ?? "",
        };
      });

      const sendData = {
        id: detail.id,
        customer: {
          id: detail?.customerId ?? "",
          name: detail?.Master_Customer?.name ?? "",
          rankName: detail?.Master_Customer?.Master_Rank?.name ?? "",
          phoneNumber: detail?.Master_Customer?.phoneNumber ?? "",
          email: detail?.Master_Customer?.email ?? "",
          level: detail?.Master_Customer?.Master_Rank?.level ?? "",
          address: detail?.Master_Customer?.address ?? "",
          gender: detail?.Master_Customer?.gender ?? "",
        },
        warehouseId: detail?.warehouseId ?? null,
        warehouseName: detail?.Master_Warehouse?.name ?? "",
        code: detail.code,
        subTotal: detail.subTotal,
        totalDiscount: detail.totalDiscount,
        totalPayment: detail.totalPayment,
        grandTotal: detail.grandTotal,
        status: detail?.status,
        notes: detail?.notes,
        createdBy: detail?.creator?.name ?? "",
        createdAt: detail?.createdAt,
        listProducts: listProduct,
        totalQuantity: detail?.totalQuantity,
        totalItems: detail?.totalItems,
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  // CONVERT SEMUA DATA MENJADI STRING DAN DIPISAH MENGGUNAKAN \N
  static async printPosV3(code) {
    try {
      // CONFIG PRINTER
      const configPrinter = await ConfigService.get({ query: { key: "PRINTER_SETTING" } });
      const printerSetting = configPrinter.value_json;

      // COMPANY INFO 
      const configCompany = await ConfigService.get({
        query: { key: "COMPANY_INFO" }
      });
      const companyInfo = configCompany.value_json;

      // DATA
      const data = await PointOfSaleService.getDetailPointOfSaleByCode(code);

      // 🔹 BUAT STRING PRINT
      let printString = "";

      // 🔹 HEADER
      // Kode untuk Justify Center
      printString += `\x1b\x61\x01\x1b\x21\x30${companyInfo.companyName}\n`;
      // untuk center
      printString += `\x1b\x21\x00${companyInfo.address}\n`; // 🔹 Center (Normal Size)
      printString += `${companyInfo.phoneNumber}\n`;
      printString += `${addLine(printerSetting.col)}\n`;

      // 🔹 Reset ke left align
      printString += `\x1b\x61\x00${justifyLeft(formatDate(data.createdAt), printerSetting.col / 2)}${justifyRight(formatTimeSecond(data.createdAt), printerSetting.col / 2)}\n`;
      printString += `${justifyLeft(`Order ID`, printerSetting.col / 2)}${justifyRight(data.code, printerSetting.col / 2)}\n`;
      printString += `${justifyLeft(`Customer Name`, printerSetting.col / 2)}${justifyRight(data?.customer?.name || '-', printerSetting.col / 2)}\n`;
      printString += `${addLine(printerSetting.col)}\n`;

      // 🔹 LIST PRODUK
      data.listProducts.forEach((product) => {
        let baseProductName = product?.productName || product?.title || '-';
        let productName = baseProductName;
        let addNewLineProduct = false;
        let newLineProduct = "";

        // Cek apakah nama produk terlalu panjang
        if (productName.length > printerSetting.maxProductName) {
          productName = baseProductName.substring(0, printerSetting.maxProductName);
          addNewLineProduct = true;
          newLineProduct = baseProductName.substring(printerSetting.maxProductName);
        }

        // Cetak baris pertama: Nama produk + quantity + subtotal
        printString += `${justifyLeft(productName, printerSetting.maxProductName)} x${product.quantity}${justifyRight(formatPricePosWithCurrency(product.subTotal), printerSetting.col / 2 - product?.quantity?.toString().length - 7)}\n`;

        // Jika ada baris kedua, tambahkan ke string
        if (addNewLineProduct) {
          printString += `${newLineProduct}\n`;
        }

        // Cetak unit dan harga
        printString += `${addSpace(2)}${product?.unitName} @${priceFormat(product?.price)}\n`;
      });

      // 🔹 TOTAL ITEMS
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `Total Items: ${data.totalItems}\n`;

      // 🔹 SUBTOTAL
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `${justifyLeft(`Subtotal`, printerSetting.col / 2)}${justifyRight(formatPricePosWithCurrency(data?.subTotal), printerSetting.col / 2)}\n`;

      // 🔹 TOTAL
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `${justifyLeft(`Total`, printerSetting.col / 2)}${justifyRight(formatPricePosWithCurrency(data?.grandTotal), printerSetting.col / 2)}\n`;

      // 🔹 PEMBAYARAN
      printString += `${justifyLeft(`Cash`, printerSetting.col / 2)}${justifyRight(formatPricePosWithCurrency(data?.totalPayment), printerSetting.col / 2)}\n`;
      printString += `${justifyLeft(`Change`, printerSetting.col / 2)}${justifyRight(formatPricePosWithCurrency(data?.totalPayment - data?.grandTotal), printerSetting.col / 2)}\n`;

      // 🔹 AKHIR
      printString += `\n`;

      //! TESTING PURPOSE
      // virtualConsoleLogPos(printString);

      return { string: printString, printerSetting };
    } catch (error) {
      throw error;
    }
  }

  static async runSchedulerReportPos() {
    try {
      /**
       * 1. Find all transactions in the last 1 day
       * 2. Generate report Excel
       * 3. Send email with the report attached
       */

      const startOfYesterday = new Date();
      startOfYesterday.setHours(0, 0, 0, 0);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const endOfYesterday = new Date();
      endOfYesterday.setHours(0, 0, 0, 0);

      const lastDayTransactions = await Pos_Transaction.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfYesterday, endOfYesterday],
          },
        },
        include: [
          {
            model: Master_Customer,
            attributes: ["name", "email", "alias"],
          },
          {
            model: Master_User,
            as: "creator",
            attributes: ["name", "email"],
          }
        ]
      });
      const filePath = await ExportPointOfSaleService.generateExcel(lastDayTransactions, startOfYesterday);

      const transporterConnection = await transporter();

      const msg = {
        from: process.env.EMAIL_IS,
        to: process.env.EMAIL_RECEIVER,
        bcc: process.env.EMAIL_RECEIVER_BCC,
        subject: `POS Report - ${startOfYesterday.toLocaleDateString("id-ID")}`,
        text: `Berikut laporan Point of Sale dalam 24 jam terakhir.`,
        html: `<p>Berikut laporan Point of Sale dalam 24 jam terakhir.</p>`,
        attachments: [
          {
            filename: filePath.split("/").pop(),
            path: filePath,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      };

      await transporterConnection.sendMail(msg);

      // 4️⃣ Clean up file
      await fs.unlink(filePath);
    } catch (err) {
      throw err;
    }
  }

}

module.exports = PointOfSaleService;
