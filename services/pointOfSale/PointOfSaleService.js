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
} = require("../../models");
const { Op } = require("sequelize");
const ConfigService = require("../config/configService");

//! SHOULD INSTALL escpos and escpos-network
// const escpos = require("escpos");
// const Network = require("escpos-network");

const { formatDate, formatTimeSecond } = require("../../helpers/formatDate");
const { addLine, justifyLeft, justifyRight, addSpace } = require("../../helpers/posFunction");
const { priceFormat, formatPricePosWithCurrency } = require("../../helpers/priceFormat");


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
        priceMap[`${price.productId}_${price.unitId}`] = price.basePrice;
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
      const generateCode = await codeGenerator(8, "POS");

      let totalQuantity = 0;
      // Count total quantity
      data.listProduct?.forEach((item) => {
        totalQuantity += item.quantity;
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
        },
        { transaction }
      );

      const createPosProducts = [];
      const listProduct = data?.listProduct;

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

  static async getAllPointOfSaleByWarehouseId(warehouseId) {
    try {
      const getAllPosTransaction = await Pos_Transaction.findAll({
        where: {
          warehouseId,
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
          totalQuantity: item?.totalQuantity
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
        totalQuantity: detail?.totalQuantity
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  //! SHOULD INSTALL PACKAGE escpos
  // static async printPos(code) {
  //   try {
  //     // CONFIG PRINTER
  //     const configPrinter = await ConfigService.get({
  //       key: "PRINTER_SETTING",
  //     })
  //     const printerSetting = configPrinter.value_json

  //     // COMPANY INFO 
  //     const configCompany = await ConfigService.get({
  //       key: "COMPANY_INFO",
  //     })
  //     const companyInfo = configCompany.value_json

  //     // DATA
  //     const data = await PointOfSaleService.getDetailPointOfSaleByCode(code)

  //     // INITIATE PRINTER
  //     const device = new Network(printerSetting.ip, printerSetting.port);
  //     const printer = new escpos.Printer(device);

  //     // Membuka koneksi dengan printer menggunakan Promise
  //     await new Promise((resolve, reject) => {
  //       device.open((err) => {
  //         if (err) {
  //           console.error("Error:", err);
  //           reject(err); // Reject jika gagal membuka koneksi
  //         } else {
  //           resolve(); // Resolve jika berhasil membuka koneksi
  //         }
  //       });
  //     });

  //     // HEADER
  //     printer
  //       .align("ct")
  //       .size(1, 1)
  //       .text(companyInfo.companyName)
  //       .size(0, 0)
  //       .text(companyInfo.address)
  //       .text(companyInfo.phoneNumber)
  //       .text(addLine(printerSetting.col))
  //       .style("normal")
  //       .align("lt")
  //       .text(justifyLeft(formatDate(data.createdAt), printerSetting.col / 2) + justifyRight(formatTimeSecond(data.createdAt), printerSetting.col / 2))
  //       .text(justifyLeft(`Order ID`, printerSetting.col / 2) + justifyRight(data.code, printerSetting.col / 2))
  //       .text(justifyLeft(`Customer Name`, printerSetting.col / 2) + justifyRight(data?.customer?.name || '-', printerSetting.col / 2))
  //       .text(addLine(printerSetting.col));

  //     // LIST PRODUK
  //     data.listProducts.forEach((product) => {
  //       let baseProductName = product?.productName || product?.title || '-';
  //       let productName = product?.productName || product?.title || '-';
  //       let addNewLineProduct = false;
  //       let newLineProduct = "";

  //       // Cek apakah nama produk melebihi batas
  //       if (productName.length > printerSetting.maxProductName) {
  //         productName = baseProductName.substring(0, printerSetting.maxProductName);  // Potong nama produk pada batas
  //         addNewLineProduct = true;  // Tandai bahwa kita perlu menambahkan baris baru
  //         newLineProduct = baseProductName.substring(printerSetting.maxProductName, baseProductName.length);  // Ambil sisa nama produk untuk baris kedua
  //       }

  //       // Cetak baris pertama: nama produk + quantity + subtotal
  //       printer
  //         .align("lt")
  //         .text(
  //           justifyLeft(productName, printerSetting.maxProductName)
  //           + ` x${product.quantity}`
  //           + justifyRight(`${formatPricePosWithCurrency(product.subTotal)}`, printerSetting.col / 2 - product?.quantity?.toString().length - 7)
  //         );

  //       // Jika ada baris kedua, cetak newLineProduct
  //       if (addNewLineProduct) {
  //         printer
  //           .text(newLineProduct);  // Cetak nama produk yang terpotong pada baris kedua
  //       }

  //       // Cetak baris informasi tambahan (unit dan harga)
  //       printer
  //         .text(addSpace(2) + product?.unitName + "@" + priceFormat(product?.price));
  //     });


  //     printer.text(addLine(printerSetting.col));
  //     // TOTAL QUANTITY
  //     printer.text(justifyLeft(`Total Quantity`, printerSetting.maxProductName) + ` x${data.totalQuantity}`);

  //     printer.text(addLine(printerSetting.col));
  //     // SUBTOTAL
  //     printer.text(justifyLeft(`Subtotal`, printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.subTotal), printerSetting.col / 2));

  //     printer.text(addLine(printerSetting.col));

  //     // TOTAL
  //     printer.text(justifyLeft(`Total`, printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.grandTotal), printerSetting.col / 2));

  //     // PAYMENT
  //     printer.text(justifyLeft(`Cash`, printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.totalPayment), printerSetting.col / 2));

  //     // PAYMENT
  //     printer.text(justifyLeft(`Change`, printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.totalPayment - data?.grandTotal), printerSetting.col / 2));

  //     // CUT & CLOSE
  //     printer.text("")

  //     printer.cut();
  //     printer.close();

  //     return data;
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  //! SHOULD INSTALL PACKAGE escpos
  // static async printPosV2(code) {
  //   try {
  //     // CONFIG PRINTER
  //     const configPrinter = await ConfigService.get({
  //       key: "PRINTER_SETTING",
  //     });
  //     const printerSetting = configPrinter.value_json;

  //     // COMPANY INFO
  //     const configCompany = await ConfigService.get({
  //       key: "COMPANY_INFO",
  //     });
  //     const companyInfo = configCompany.value_json;

  //     // DATA
  //     const data = await PointOfSaleService.getDetailPointOfSaleByCode(code);

  //     // Buat buffer kosong
  //     const buffer = [];

  //     // Gunakan buffer untuk menyusun ESC/POS commands
  //     // HEADER
  //     buffer.push(Buffer.from([0x1B, 0x61, 0x01])); // Center alignment
  //     buffer.push(Buffer.from(companyInfo.companyName + '\n'));
  //     buffer.push(Buffer.from(companyInfo.address + '\n'));
  //     buffer.push(Buffer.from(companyInfo.phoneNumber + '\n'));
  //     buffer.push(Buffer.from(addLine(printerSetting.col) + '\n'));

  //     // Header Informasi Order
  //     buffer.push(Buffer.from(justifyLeft(formatDate(data.createdAt), printerSetting.col / 2) + justifyRight(formatTimeSecond(data.createdAt), printerSetting.col / 2) + '\n'));
  //     buffer.push(Buffer.from(justifyLeft('Order ID', printerSetting.col / 2) + justifyRight(data.code, printerSetting.col / 2) + '\n'));
  //     buffer.push(Buffer.from(justifyLeft('Customer Name', printerSetting.col / 2) + justifyRight(data?.customer?.name || '-', printerSetting.col / 2) + '\n'));
  //     buffer.push(Buffer.from(addLine(printerSetting.col) + '\n'));

  //     // List Produk
  //     data.listProducts.forEach((product) => {
  //       let baseProductName = product?.productName || product?.title || '-';
  //       let productName = baseProductName;
  //       let addNewLineProduct = false;
  //       let newLineProduct = "";

  //       if (productName.length > printerSetting.maxProductName) {
  //         productName = baseProductName.substring(0, printerSetting.maxProductName); // Potong nama produk
  //         addNewLineProduct = true; // Tandai produk terpotong
  //         newLineProduct = baseProductName.substring(printerSetting.maxProductName); // Ambil sisa nama
  //       }

  //       // Cetak Nama Produk, Quantity, Subtotal
  //       buffer.push(Buffer.from(justifyLeft(productName, printerSetting.maxProductName) + ` x${product.quantity}` + justifyRight(`${formatPricePosWithCurrency(product.subTotal)}`, printerSetting.col / 2 - product?.quantity?.toString().length - 7) + '\n'));

  //       // Jika ada nama produk yang terpotong, cetak pada baris kedua
  //       if (addNewLineProduct) {
  //         buffer.push(Buffer.from(newLineProduct + '\n')); // Cetak nama produk yang terpotong
  //       }

  //       // Informasi tambahan produk (unit dan harga)
  //       buffer.push(Buffer.from(addSpace(2) + product?.unitName + "@" + priceFormat(product?.price) + '\n'));
  //     });

  //     buffer.push(Buffer.from(addLine(printerSetting.col) + '\n'));

  //     // Total Quantity
  //     buffer.push(Buffer.from(justifyLeft('Total Quantity', printerSetting.maxProductName) + ` x${data.totalQuantity}` + '\n'));

  //     buffer.push(Buffer.from(addLine(printerSetting.col) + '\n'));

  //     // Subtotal
  //     buffer.push(Buffer.from(justifyLeft('Subtotal', printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.subTotal), printerSetting.col / 2) + '\n'));

  //     buffer.push(Buffer.from(addLine(printerSetting.col) + '\n'));

  //     // Total
  //     buffer.push(Buffer.from(justifyLeft('Total', printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.grandTotal), printerSetting.col / 2) + '\n'));

  //     // Payment
  //     buffer.push(Buffer.from(justifyLeft('Cash', printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.totalPayment), printerSetting.col / 2) + '\n'));

  //     // Change
  //     buffer.push(Buffer.from(justifyLeft('Change', printerSetting.col / 2) + justifyRight(formatPricePosWithCurrency(data?.totalPayment - data?.grandTotal), printerSetting.col / 2) + '\n'));

  //     // Cut & Close
  //     buffer.push(Buffer.from('\n'));

  //     return {
  //       buffer,
  //       printerSetting,
  //     }; // Mengembalikan buffer yang sudah dibentuk
  //   } catch (error) {
  //     console.error("❌ Error printing:", error);
  //     throw error;
  //   }
  // }

  // CONVERT SEMUA DATA MENJADI STRING DAN DIPISAH MENGGUNAKAN \N
  static async printPosV3(code) {
    try {
      // CONFIG PRINTER
      const configPrinter = await ConfigService.get({ key: "PRINTER_SETTING" });
      const printerSetting = configPrinter.value_json;

      // COMPANY INFO 
      const configCompany = await ConfigService.get({ key: "COMPANY_INFO" });
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

      // 🔹 TOTAL QUANTITY
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `${justifyLeft(`Total Quantity`, printerSetting.maxProductName)} x${data.totalQuantity}\n`;

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

      return { string: printString, printerSetting };
    } catch (error) {
      throw error;
    }
  }

}

module.exports = PointOfSaleService;
