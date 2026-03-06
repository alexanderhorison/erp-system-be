const { codeGenerator } = require("../../helpers/codeGenerator");
const { throwValidation } = require("../../helpers/responses");
const { ROLES } = require("../../const/roles");
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
  Dashboard_Summary_Pos_Customer,
  Pos_User_Shift,
  Master_Shift,
} = require("../../models");
const { Op } = require("sequelize");
const ConfigService = require("../config/configService");
const { formatDate, formatTimeSecond } = require("../../helpers/formatDate");
const {
  addLine,
  justifyLeft,
  justifyRight,
  addSpace,
  virtualConsoleLogPos,
} = require("../../helpers/posFunction");
const {
  priceFormat,
  formatPricePosWithCurrency,
} = require("../../helpers/priceFormat");
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
            attributes: ["name", "companyId", "categoryId", "typeId", "description"],
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
        description: item.Master_Product.description,
      }));

      return formatData;
    } catch (error) {
      throw error;
    }
  }

  static async validatePrice(listProduct) {
    try {
      const masterProductPriceIds = listProduct
        .map((item) => item.MasterProductPriceId)
        .filter(Boolean);

      const prices = await Master_Product_Price.findAll({
        where: { id: masterProductPriceIds },
        include: [
          { model: Master_Product, attributes: ["name"] },
          { model: Master_Unit, attributes: ["name"] },
        ],
      });

      const priceMap = {};
      prices.forEach((price) => {
        priceMap[price.id] = price;
      });

      const warehouseProductIds = listProduct
        .map((item) => item.warehouseProductId)
        .filter(Boolean);

      const warehouseProducts =
        warehouseProductIds.length > 0
          ? await Warehouse_Product.findAll({
              where: { id: warehouseProductIds },
              attributes: ["id", "productId", "unitId"],
              include: [
                { model: Master_Product, attributes: ["name"] },
                { model: Master_Unit, attributes: ["name"] },
              ],
            })
          : [];

      const warehouseProductMap = {};
      warehouseProducts.forEach((wp) => {
        warehouseProductMap[wp.id] = wp;
      });

      const result = listProduct.map((item) => {
        const priceRecord = priceMap[item.MasterProductPriceId];
        const warehouseProduct = item.warehouseProductId
          ? warehouseProductMap[item.warehouseProductId]
          : null;

        // If no MasterProductPriceId or record not found, backendPrice is 0
        const backendPrice = priceRecord ? Number(priceRecord.basePricePos) : 0;
        const cartPrice = Number(item.price || 0);
        const cartSubTotal = Number(item.subTotal || 0);
        const backendSubTotal = backendPrice * Number(item.quantity || 0);
        let isPriceDifferent = false
        // If there is no price than no need to be change
        if (item.MasterProductPriceId){
          isPriceDifferent = cartPrice !== backendPrice; 
        }

        const productName =
          item.productName ||
          warehouseProduct?.Master_Product?.name ||
          priceRecord?.Master_Product?.name ||
          item.title ||
          "-";

        const unitName =
          item.unitName ||
          warehouseProduct?.Master_Unit?.name ||
          priceRecord?.Master_Unit?.name ||
          "";

        return {
          warehouseProductId: item.warehouseProductId || null,
          MasterProductPriceId: item.MasterProductPriceId || null,
          cartIndex: item.cartIndex ?? null,
          isPriceUpdated: item.isPriceUpdated ?? false,
          productName,
          unitName,
          quantity: item.quantity,
          cartPrice,
          backendPrice,
          cartSubTotal,
          backendSubTotal,
          isPriceDifferent,
          notes: item.notes
        };
      });

      return result;
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
        priceMap[`${price.productId}_${price.unitId}`] = {
          basePricePos: price.basePricePos,
          MasterProductPriceId: price.id,
        }
      });
      const formatData = [];

      // Format the data using the pre-fetched price map
      data.forEach((item) => {
        const prices = priceMap[`${item.productId}_${item.unitId}`];
        const basePrice = prices?.basePricePos || 0;
        const MasterProductPriceId = prices?.MasterProductPriceId || null;

        let data = {
          id: item.id,
          isFavorite: item.isFavorite,
          productName: item.Master_Product?.name ?? "",
          companyName: item.Master_Product?.Master_Company?.name ?? "",
          companyId: item.Master_Product?.companyId ?? null,
          productId: item.productId,
          unitId: item.unitId,
          unitName: item.Master_Unit?.name ?? "",
          rackName: item.Master_Warehouse_Rack?.name ?? "",
          quantity: item.quantity,
          basePrice,
          MasterProductPriceId
        };

        // Priority order: 1) KALENG products with KALENG unit first, 2) SLOP unit second, 3) others last
        if (item.Master_Product?.name.toUpperCase().includes("KALENG") && item.Master_Unit?.name == "KALENG") {
          formatData.unshift(data); // KALENG product with KALENG unit gets highest priority
        } else if (item.Master_Unit?.name == "SLOP") {
          formatData.unshift(data); // SLOP unit gets second priority
        } else {
          formatData.push(data); // Everything else goes last
        }
      });

      return formatData;
    } catch (error) {
      throw error;
    }
  }

  static async createPointOfSale({ data, user }) {
    const transaction = await sq.transaction();
    try {
      if (
        Number(data.grandTotal) - Number(data.totalPayment) > 0 &&
        !data.customerId
      ) {
        throwValidation(400, "Customer harus diisi jika terdapat sisa hutang");
      }

      const generateCode = await codeGenerator(8, "POS");

      let totalQuantity = 0;
      let totalItems = 0;

      data.listProduct?.forEach((item) => {
        totalQuantity += item.quantity;
      });

      data.listProduct?.forEach((item) => {
        totalItems += 1;
      });

      // create point of sale
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const maxQueue = await Pos_Transaction.max("queueNumber", {
        where: {
          createdAt: { [Op.between]: [startOfToday, endOfToday] },
          createdBy: user.id,
        },
        transaction,
      });

      const nextQueueNumber = (Number(maxQueue) || 0) + 1;

      // Get current active shift for the user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const activeUserShift = await Pos_User_Shift.findOne({
        where: {
          userId: user.id,
          endShift: null,
          createdAt: {
            [Op.between]: [today, endOfDay],
          },
        },
        transaction,
      });

      if (!activeUserShift) {
        throwValidation(400, "User tidak memiliki shift aktif hari ini");
      }

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
          lastDebt: data.totalDebt || 0,
          queueNumber: nextQueueNumber,
          posUserShiftId: activeUserShift ? activeUserShift.id : null,
        },
        { transaction }
      );

      const createPosProducts = [];
      const listProduct = Array.isArray(data?.listProduct) ? data.listProduct : [];

      let totalHargaBarangWithoutDebt = 0;

      const warehouseProductIdsToLock = listProduct
        .filter((it) => it.warehouseProductId)
        .map((it) => it.warehouseProductId);

      const lockedWarehouseProducts = {};

      if (warehouseProductIdsToLock.length > 0) {

        const warehouseProducts = await Warehouse_Product.findAll({
          where: { id: warehouseProductIdsToLock },
          attributes: ["id", "quantity", "warehouseId", "productId", "unitId"],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        warehouseProducts.forEach((wp) => {
          lockedWarehouseProducts[wp.id] = wp;
        });

        const productIds = Array.from(new Set(warehouseProducts.map((w) => w.productId).filter(Boolean)));
        const unitIds = Array.from(new Set(warehouseProducts.map((w) => w.unitId).filter(Boolean)));

        const products = productIds.length > 0 ? await Master_Product.findAll({ where: { id: productIds }, attributes: ["id", "name"], transaction }) : [];
        const units = unitIds.length > 0 ? await Master_Unit.findAll({ where: { id: unitIds }, attributes: ["id", "name"], transaction }) : [];

        const productMap = {};
        products.forEach(p => { productMap[p.id] = p.name });
        const unitMap = {};
        units.forEach(u => { unitMap[u.id] = u.name });

        for (const item of listProduct) {
          if (item.warehouseProductId) {
            const wp = lockedWarehouseProducts[item.warehouseProductId];
            if (!wp) {
              throwValidation(400, "Salah satu product warehouse tidak ditemukan");
            }
            if (Number(wp.quantity || 0) < Number(item.quantity || 0)) {
              const productName = productMap[wp.productId] || "Produk";
              const unitName = unitMap[wp.unitId] || "unit";
              throwValidation(
                400,
                `Stok product ${productName} - ${unitName} kurang, saat ini berjumlah ${wp.quantity}`
              );
            }
          }
        }
      }

      for (const item of listProduct) {
        if (item.warehouseProductId) {
          const warehouseProduct = lockedWarehouseProducts[item.warehouseProductId];

          if (!warehouseProduct) {
            throwValidation(400, "Salah satu product warehouse tidak ditemukan");
          }

          const newWarehouseQuantity = Number(warehouseProduct.quantity || 0) - Number(item.quantity || 0);

          await warehouseProduct.update({ quantity: newWarehouseQuantity }, { transaction });

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

        if (!item.isDebt) {
          totalHargaBarangWithoutDebt += item.subTotal;
        }

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
            customerId: data.customerId,
          },
          transaction,
        });

        const grandTotal = Number(data.grandTotal) || 0;
        const totalPayment = Number(data.totalPayment) || 0;
        // Hitung sisa hutang
        let amountDebt =
          totalHargaBarangWithoutDebt + data.totalDebt - totalPayment;
        // Jika hasil negatif atau 0, berarti tidak ada hutang
        if (amountDebt <= 0) amountDebt = 0;

        // Hitung jumlah yang dibayar
        const paidAmount =
          totalPayment >= grandTotal ? grandTotal : totalPayment;

        if (findExisting) {
          // Jika ada, update
          await Dashboard_Summary_Pos_Customer.update(
            {
              totalPos: Number(findExisting.totalPos) + 1,
              totalAmountPos:
                Number(findExisting.totalAmountPos) +
                Number(totalHargaBarangWithoutDebt),
              totalAmountPaidPos:
                Number(findExisting.totalAmountPaidPos) + Number(paidAmount),
              totalAmountDebtPos: Number(amountDebt),
            },
            {
              where: { id: findExisting.id },
              transaction,
            }
          );
        } else {
          // Jika tidak ada, buat baru
          await Dashboard_Summary_Pos_Customer.create(
            {
              customerId: data.customerId,
              totalPos: 1,
              totalAmountPos: grandTotal,
              totalAmountPaidPos: paidAmount,
              totalAmountDebtPos: amountDebt,
            },
            { transaction }
          );
        }
      }

      // Update Pos User Shift totals if transaction is linked to a shift
      if (activeUserShift) {
        await Pos_User_Shift.update(
          {
            totalTransaction: Number(activeUserShift.totalTransaction || 0) + 1,
            grandTotalTransaction:
              Number(activeUserShift.grandTotalTransaction || 0) +
              Number(data.grandTotal || 0),
          },
          {
            where: { id: activeUserShift.id },
            transaction,
          }
        );
      }

      await transaction.commit();
      return {
        id: createdPointOfSale.id,
        code: createdPointOfSale.code,
        status: createdPointOfSale.status,
        queueNumber: createdPointOfSale.queueNumber,
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

  static async getAllPointOfSaleByWarehouseId(warehouseId, userId, roleId) {
    try {
      const whereClause = {
        warehouseId,
      };

      // Only add createdBy filter if user is not admin (roleId !== 1)
      if (roleId !== ROLES.ADMIN) {
        whereClause.createdBy = userId;
      }

      const getAllPosTransaction = await Pos_Transaction.findAll({
        where: whereClause,
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
          {
            model: Pos_User_Shift,
            attributes: ["id", "startShift", "endShift"],
            include: [
              {
                model: Master_Shift,
                attributes: ["id", "name"],
              },
            ]
          }
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
          queueNumber: item?.queueNumber,
          shift: item?.Pos_User_Shift ? {
            id: item?.Pos_User_Shift?.id,
            startShift: item?.Pos_User_Shift?.startShift,
            endShift: item?.Pos_User_Shift?.endShift,
            shiftName: item?.Pos_User_Shift?.Master_Shift?.name,
          } : null,
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
          {
            model: Pos_User_Shift,
            attributes: ["id", "startShift", "endShift"],
            include: [
              {
                model: Master_Shift,
                attributes: ["id", "name"],
              },
            ]
          }
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
                attributes: ["id", "name", "description"],
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
          description:
            item?.Warehouse_Product?.Master_Product?.description ?? "",
          companyName:
            item?.Warehouse_Product?.Master_Product?.Master_Company?.name ?? "",
          rackName: item?.Warehouse_Product?.Master_Warehouse_Rack?.name ?? "",
          warehouseProductId: item?.Warehouse_Product?.id ?? "",
          warehouseName: item?.Warehouse_Product?.Master_Warehouse?.name ?? "",
          warehouseId: item?.Warehouse_Product?.Master_Warehouse?.id ?? "",
        };
      });

      // Calculate debt only if customer exists (grandTotal - totalPayment)
      const debtAmount = detail.customerId
        ? Number(detail.grandTotal || 0) - Number(detail.totalPayment || 0)
        : 0;

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
        debt: debtAmount > 0 ? debtAmount : 0, // Only show positive debt
        change: debtAmount < 0 ? Math.abs(debtAmount) : 0, // Show change if payment exceeds grandTotal
        lastDebt: detail?.lastDebt ?? 0, // Hutang sebelumnya
        status: detail?.status,
        notes: detail?.notes,
        createdBy: detail?.creator?.name ?? "",
        createdAt: detail?.createdAt,
        queueNumber: detail.queueNumber,
        listProducts: listProduct,
        totalQuantity: detail?.totalQuantity,
        totalItems: detail?.totalItems,
        shift: detail?.Pos_User_Shift ? {
          id: detail?.Pos_User_Shift?.id,
          startShift: detail?.Pos_User_Shift?.startShift,
          endShift: detail?.Pos_User_Shift?.endShift,
          shiftName: detail?.Pos_User_Shift?.Master_Shift?.name,
        } : null
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async voidPointOfSale(code, adminUserId, pin, performedBy) {
    const transaction = await sq.transaction();
    try {
      // Validate admin user and PIN early
      const adminUser = await Master_User.findOne({ where: { id: adminUserId } });
      if (!adminUser) {
        throwValidation(400, "User tidak ditemukan");
      }
      if (Number(adminUser.roleId) !== 1) {
        throwValidation(400, "User tidak memiliki akses admin");
      }
      if (String(adminUser.pin) !== String(pin)) {
        throwValidation(400, "PIN salah");
      }

      // Find POS transaction
      const pos = await Pos_Transaction.findOne({ where: { code: code } });
      if (!pos) {
        throwValidation(400, "Data tidak ditemukan");
      }
      if (pos.status === "VOID") {
        throwValidation(400, "Transaksi sudah VOID");
      }

      // Get details
      const details = await Pos_Transaction_Detail.findAll({
        where: { posTransactionId: pos.id },
      });

      // Restore quantities and create stock adjustment histories
      for (const item of details) {
        if (item.warehouseProductId) {
          const warehouseProduct = await Warehouse_Product.findOne({
            where: { id: item.warehouseProductId },
          });

          if (!warehouseProduct) {
            throwValidation(400, "Warehouse product tidak ditemukan");
          }

          const newQuantity = Number(warehouseProduct.quantity || 0) +
            Number(item.quantity || 0);

          await Warehouse_Product.update(
            { quantity: newQuantity },
            { where: { id: warehouseProduct.id }, transaction }
          );

          await Stock_Adjustment_History.create(
            {
              productWarehouseId: warehouseProduct.id,
              quantity: item.quantity,
              adjustmentType: "PLUS",
              warehouseId: warehouseProduct.warehouseId,
              userId: adminUserId,
              info: "VOID POINT OF SALE",
              posTransactionId: pos.id,
              lastQuantity: newQuantity,
            },
            { transaction }
          );
        }
      }

      // Mark POS transaction as VOID
      await Pos_Transaction.update(
        { status: "VOID", updatedBy: adminUserId },
        { where: { id: pos.id }, transaction }
      );

      // If transaction has customer, update dashboard summary
      if (pos.customerId) {
        const findExisting = await Dashboard_Summary_Pos_Customer.findOne({
          where: { customerId: pos.customerId },
          transaction,
        });

        if (findExisting) {
          // Use stored fields to approximate values used during creation
          const totalHargaBarangWithoutDebt = Number(pos.subTotal || 0);
          const grandTotal = Number(pos.grandTotal || 0);
          const totalPayment = Number(pos.totalPayment || 0);
          const lastDebt = Number(pos.lastDebt || 0);

          let amountDebt = totalHargaBarangWithoutDebt + lastDebt - totalPayment;
          if (amountDebt <= 0) amountDebt = 0;

          const paidAmount = totalPayment >= grandTotal ? grandTotal : totalPayment;

          await Dashboard_Summary_Pos_Customer.update(
            {
              totalPos: Number(findExisting.totalPos) - 1,
              totalAmountPos:
                Number(findExisting.totalAmountPos) -
                Number(totalHargaBarangWithoutDebt),
              totalAmountPaidPos:
                Number(findExisting.totalAmountPaidPos) -
                Number(paidAmount),
              totalAmountDebtPos: Math.max(
                0,
                Number(findExisting.totalAmountDebtPos) - Number(amountDebt)
              ),
            },
            { where: { id: findExisting.id }, transaction }
          );
        }
      }

      // Reduce Pos User Shift totals if transaction was linked to a shift
      if (pos.posUserShiftId) {
        const userShift = await Pos_User_Shift.findByPk(pos.posUserShiftId, {
          transaction,
        });

        if (userShift) {
          await Pos_User_Shift.update(
            {
              totalTransaction: Math.max(
                0,
                Number(userShift.totalTransaction || 0) - 1
              ),
              grandTotalTransaction: Math.max(
                0,
                Number(userShift.grandTotalTransaction || 0) -
                  Number(pos.grandTotal || 0)
              ),
            },
            {
              where: { id: userShift.id },
              transaction,
            }
          );
        }
      }

      await transaction.commit();

      return { id: pos.id, code: pos.code, status: "VOID" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // CONVERT SEMUA DATA MENJADI STRING DAN DIPISAH MENGGUNAKAN \N
  static async printPosV3(code, isCopy = false) {
    try {
      // CONFIG PRINTER
      const configPrinter = await ConfigService.get({
        query: { key: "PRINTER_SETTING_POS" },
      });

      const printerSetting = configPrinter.value_json;

      // COMPANY INFO
      const configCompany = await ConfigService.get({
        query: { key: "COMPANY_INFO" },
      });

      const companyInfo = configCompany.value_json;

      // DATA
      const data = await PointOfSaleService.getDetailPointOfSaleByCode(code);

      // 🔹 BUAT STRING PRINT
      let printString = "";

      // 🔹 HEADER
      // Kode untuk Justify Center
      // Use POS-specific company name when provided, otherwise fall back to main company name
      const headerCompanyName = companyInfo.companyNamePos || companyInfo.companyName;
      printString += `\x1b\x61\x01\x1b\x21\x30${headerCompanyName}\n`;
      // untuk center
      printString += `\x1b\x21\x00${companyInfo.address}\n`; // 🔹 Center (Normal Size)
      printString += `${companyInfo.phoneNumber}\n`;
      printString += `${addLine(printerSetting.col)}\n`;

      // 🔹 Reset ke left align
      printString += `\x1b\x61\x00${justifyLeft(
        formatDate(data.createdAt),
        printerSetting.col / 2
      )}${justifyRight(
        formatTimeSecond(data.createdAt),
        printerSetting.col / 2
      )}\n`;
      printString += `${justifyLeft(
        `Order ID`,
        printerSetting.col / 2
      )}${justifyRight(data.code, printerSetting.col / 2)}\n`;
      printString += `${justifyLeft(
        `Queue`,
        printerSetting.col / 2
      )}${justifyRight(String(data.queueNumber || "-"), printerSetting.col / 2)}\n`;
      printString += `${justifyLeft(
        `Kasir`,
        printerSetting.col / 2
      )}${justifyRight(data?.createdBy || "-", printerSetting.col / 2)}\n`;
      printString += `${addLine(printerSetting.col)}\n`;

      // Add "THIS IS A COPY" if it's a copy
      if (isCopy) {
        printString += `\x1b\x61\x01\x1b\x21\x30THIS IS A COPY\n`; // Center + Bold
        printString += `\x1b\x61\x00\x1b\x21\x00`; // Reset to left align + normal size
        printString += `${addLine(printerSetting.col)}\n`;
      }

      printString += `${justifyLeft(
        `Customer Name`,
        printerSetting.col / 2
      )}${justifyRight(data?.customer?.name || "-", printerSetting.col / 2)}\n`;
      printString += `${addLine(printerSetting.col)}\n`;

      // 🔹 LIST PRODUK
      data.listProducts.forEach((product) => {
        let baseProductName =
          product?.description || product?.productName || product?.title || "-";
        let productName = baseProductName;
        let addNewLineProduct = false;
        let newLineProduct = "";

        // Cek apakah nama produk terlalu panjang
        if (productName.length > printerSetting.maxProductName) {
          productName = baseProductName.substring(
            0,
            printerSetting.maxProductName
          );
          addNewLineProduct = true;
          newLineProduct = baseProductName.substring(
            printerSetting.maxProductName
          );
        }

        // Cetak baris pertama: Nama produk + quantity + subtotal
        printString += `${justifyLeft(
          productName,
          printerSetting.maxProductName
        )} x${product.quantity}${justifyRight(
          formatPricePosWithCurrency(product.subTotal),
          printerSetting.col / 2 - product?.quantity?.toString().length - 7
        )}\n`;

        // Jika ada baris kedua, tambahkan ke string
        if (addNewLineProduct) {
          printString += `${newLineProduct}\n`;
        }

        // Cetak unit dan harga
        printString += `${addSpace(2)}${product?.unitName} @${priceFormat(
          product?.price
        )}\n`;

        // Cetak notes produk jika ada
        if (product?.notes && product?.notes.trim() !== "") {
          printString += `${addSpace(2)}Note: ${product.notes}\n`;
        }
      });

      // 🔹 TOTAL ITEMS
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `Total Items: ${data.totalItems}\n`;

      // 🔹 SUBTOTAL
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `${justifyLeft(
        `Subtotal`,
        printerSetting.col / 2
      )}${justifyRight(
        formatPricePosWithCurrency(data?.subTotal),
        printerSetting.col / 2
      )}\n`;

      // 🔹 TOTAL
      printString += `${addLine(printerSetting.col)}\n`;
      printString += `${justifyLeft(
        `Total`,
        printerSetting.col / 2
      )}${justifyRight(
        formatPricePosWithCurrency(data?.grandTotal),
        printerSetting.col / 2
      )}\n`;

      // 🔹 PEMBAYARAN
      printString += `${justifyLeft(
        `Cash`,
        printerSetting.col / 2
      )}${justifyRight(
        formatPricePosWithCurrency(data?.totalPayment),
        printerSetting.col / 2
      )}\n`;

      // Calculate debt or change (only show debt if customer exists)
      const debtOrChange = data?.totalPayment - data?.grandTotal;

      if (data?.customer?.id && debtOrChange < 0) {
        // If customer exists and there is debt (negative means debt)
        printString += `${justifyLeft(
          `Sisa Hutang`,
          printerSetting.col / 2
        )}${justifyRight(
          formatPricePosWithCurrency(Math.abs(debtOrChange)),
          printerSetting.col / 2
        )}\n`;
      } else if (debtOrChange > 0) {
        // If there is change (positive)
        printString += `${justifyLeft(
          `Change`,
          printerSetting.col / 2
        )}${justifyRight(
          formatPricePosWithCurrency(debtOrChange),
          printerSetting.col / 2
        )}\n`;
      }

      // 🔹 AKHIR
      printString += `\n\n\n\n\n`; // Tambahkan 5 baris kosong agar semua konten keluar dari printer

      // 🔹 POTONG KERTAS
      printString += `\x1d\x56\x00`; // Cut paper (full cut)

      //! TESTING PURPOSE
      // virtualConsoleLogPos(printString);

      return { string: printString };
    } catch (error) {
      throw error;
    }
  }

  static async getAllPointOfSaleByCustomerId(customerId) {
    try {
      const getAllPosTransaction = await Pos_Transaction.findAll({
        where: {
          customerId,
        },
        include: [
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
            include: [{ model: Master_Role, attributes: ["name"] }],
          },
          { model: Master_Warehouse, attributes: ["name"], paranoid: true },
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
          createdBy: item?.creator,
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

  static async runSchedulerReportPos() {
    try {
      /**
       * 1. Find all transactions from start of today until current time
       * 2. Order by grandTotal (highest first)
       * 3. Generate report Excel
       * 4. Send email with the report attached
       *
       * Example: If run at 7 PM on Nov 17, it will get transactions from Nov 17 00:00 - Nov 17 19:00
       */

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const now = new Date();

      const todayTransactions = await Pos_Transaction.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, now],
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
          },
          {
            model: Pos_Transaction_Payment_History,
            include: [
              {
                model: Pos_Payment_Type,
                attributes: ["id", "label", "code", "description"],
              },
            ],
          },
          {
            model: Pos_User_Shift,
            attributes: ["id", "startShift", "endShift"],
            include: [
              {
                model: Master_Shift,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["grandTotal", "DESC"]],
      });

      const filePath = await ExportPointOfSaleService.generateExcel(
        todayTransactions
      );

      const transporterConnection = await transporter();

      const nowJakarta = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });

      const msg = {
        from: process.env.EMAIL_IS,
        to: process.env.EMAIL_RECEIVER,
        bcc: process.env.EMAIL_RECEIVER_BCC,
        subject: `POS Report - ${startOfToday.toLocaleDateString("id-ID")}`,
        text: `Berikut laporan Point of Sale hari ini sampai dengan pukul ${nowJakarta}.`,
        html: `<p>Berikut laporan Point of Sale hari ini sampai dengan pukul ${nowJakarta}.</p>`,
        attachments: [
          {
            filename: filePath.split("/").pop(),
            path: filePath,
            contentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      };

      await transporterConnection.sendMail(msg);

      // 4️⃣ Clean up file
      await fs.unlink(filePath);
      return { message: "Email sent", data: todayTransactions?.length };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = PointOfSaleService;
