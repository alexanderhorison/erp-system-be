const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");
const { throwValidation } = require("../../helpers/responses");
const { buildQueryOptions, buildPaginationResponse } = require("../../helpers/queryBuilderHelper");
const { Op } = require("sequelize");
const {
  sequelize: sq,
  Master_Product,
  Master_Unit,
  Master_User,
  Master_Company,
  Master_Warehouse,
  Master_Role,
  Warehouse_Product,
  Master_Warehouse_Rack,
  Master_Vendor,
  Stock_Adjustment_History,
  Master_Rank,
  Purchase_Order,
  Purchase_Order_Detail,
  Purchase_Order_Barter_Detail,
  Dashboard_Summary_Vendor,
  Master_Modal,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class PurchaseOrderService {
  static async getAll({ user, query }) {
    try {
      // Gunakan helper untuk membangun options query dinamis
      const queryOptions = buildQueryOptions(query, {
        searchFields: ['code', '$Master_Vendor.name$'],
        statusField: 'status',
        dateField: 'createdAt',
        enableDate: true,
      });

      // Override date filtering jika ada dateFrom/dateTo
      if (query?.dateFrom || query?.dateTo) {
        const dateCondition = {};

        if (query?.dateFrom) {
          dateCondition[Op.gte] = new Date(query.dateFrom + 'T00:00:00.000Z');
        }

        if (query?.dateTo) {
          dateCondition[Op.lte] = new Date(query.dateTo + 'T23:59:59.999Z');
        }

        queryOptions.where = queryOptions.where || {};
        queryOptions.where.createdAt = dateCondition;
      }

      const allData = await Purchase_Order.findAndCountAll({
        ...queryOptions, // Spread options dari helper
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
            model: Master_User,
            as: "approver",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_Vendor,
          },
        ],
      });

      const sendData = allData.rows.map((item) => {
        return {
          id: item.id,
          code: item.code,
          grandTotal: item?.grandTotal,
          amountPaid: item?.amountPaid,
          amountDebt: item?.amountDebt,
          notes: item?.notes,
          status: item?.status,
          createdBy: {
            name: item?.creator?.name,
            roleName: item?.creator?.Master_Role?.name,
          },
          createdAt: item?.createdAt,
          dateCreated: formatDate(item?.createdAt),
          approverBy: {
            name: item?.approver?.name,
            roleName: item?.approver?.Master_Role?.name,
          },
          approvedAt: item?.approvedAt,
          dateApproved: formatDate(item?.approvedAt),
          dueDate: item?.dueDate,
          vendor: item?.Master_Vendor,
        };
      });

      return {
        data: sendData,
        pagination: buildPaginationResponse(allData, query),
      };
    } catch (error) {
      throw error;
    }
  }

  static async create({ data, user }) {
    const transaction = await sq.transaction();
    try {
      const generateCode = await codeGenerator(8, "PO");

      const createdData = await Purchase_Order.create(
        {
          code: generateCode,
          warehouseId: null,
          vendorId: data.vendorId,
          grandTotal: data.grandTotal,
          grandTotalVendor: data.grandTotalVendor,
          grandTotalBarter: data.grandTotalBarter,
          notes: data?.notes || "",
          status: "PENDING",
          createdBy: user?.id,
          dueDate: data?.dueDate,
        },
        { transaction }
      );

      const createPurchaseOrderProducts = [];
      const createPurchaseOrderBarterProducts = [];
      const listProduct = data?.listProduct;
      const listBarterProduct = data?.listBarterProduct;
      const createHistoryAdjusment = [];

      /**
       * Get warehouse product from (productId, unitId, warehouseId)
       * - if not found initiate to get warehouseProductId and add to array purchase order products
       * - if found add purchase order product with warehouseProductId
       */
      // ADD List Purchase Order Products
      for (const item of listProduct) {
        // find product warehouse id
        let warehouseProduct = await Warehouse_Product.findOne({
          where: {
            productId: item.masterProductId,
            unitId: item.unitId,
            warehouseId: item.warehouseId,
          },
          attributes: ["id"],
        });

        // IF NOT FOUND, CREATE
        if (!warehouseProduct) {
          // find default rack
          const defaultRackId = await Master_Warehouse_Rack.findOne({
            where: {
              warehouseId: item.warehouseId,
              name: "default",
            },
            attributes: ["id"],
          });

          const createdId = await Warehouse_Product.create(
            {
              productId: item.masterProductId,
              unitId: item.unitId,
              warehouseId: item.warehouseId,
              quantity: 0,
              minimumStock: 1,
              warehouseRackId: defaultRackId?.id,
            },
            { transaction }
          );
          warehouseProduct = createdId;
          // CREATE HISTORY for initiate product
          createHistoryAdjusment.push({
            productWarehouseId: createdId.id,
            quantity: 0,
            adjustmentType: "INITIATE",
            warehouseId: item.warehouseId,
            description: "initiate product saat create purchase order",
            userId: user.id,
            info: "PURCHASE ORDER",
            purchaseOrderId: createdData.id,
            lastQuantity: 0,
          });

          // Push purchase product
          createPurchaseOrderProducts.push({
            purchaseOrderId: createdData.id,
            warehouseProductId: warehouseProduct.id,
            price: item.price,
            quantity: item.quantity,
            subTotal: item.subTotal,
            isNewModal: item.isNewModal,
          });
        } else {
          // Push purchase product
          createPurchaseOrderProducts.push({
            purchaseOrderId: createdData.id,
            warehouseProductId: warehouseProduct.id,
            price: item.price,
            quantity: item.quantity,
            subTotal: item.subTotal,
            isNewModal: item.isNewModal,
          });
        }
      }

      // ADD PURCHASE ORDER BARTER PRODUCT
      if (listBarterProduct?.length > 0) {
        for (const item of listBarterProduct) {
          const findWarehouseProduct = await Warehouse_Product.findByPk(
            item.warehouseProductId
          );

          if (!findWarehouseProduct) {
            throwValidation(
              400,
              "Salah satu product warehouse tidak ditemukan"
            );
          }

          // push PURCHASE order products
          createPurchaseOrderBarterProducts.push({
            purchaseOrderId: createdData.id,
            warehouseProductId: item.warehouseProductId,
            price: item.price,
            quantity: item.quantity,
            subTotal: item.subTotal,
            modal: item.modal,
          });
        }
      }

      await Purchase_Order_Detail.bulkCreate(createPurchaseOrderProducts, {
        transaction,
      });

      if (createPurchaseOrderBarterProducts.length > 0) {
        await Purchase_Order_Barter_Detail.bulkCreate(
          createPurchaseOrderBarterProducts,
          {
            transaction,
          }
        );
      }

      // If there is created history adjustment product
      if (createHistoryAdjusment.length > 0) {
        await StockAdjustmentHistoryService.bulkCreate({
          data: createHistoryAdjusment,
          transaction: transaction,
        });
      }

      await transaction.commit();
      return createdData;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async approve({ code, user }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Purchase_Order.findOne({
        where: {
          code: code,
        },
      });

      // CHECKING STATUS
      switch (exsistingData?.status) {
        case "APPROVED":
          throwValidation(400, "Data sudah di approve");
        case "REJECTED":
          throwValidation(400, "Data sudah di reject");
        default:
          if (!exsistingData) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }

      // FIND PRODUCT PURCHASE ORDER
      const purchaseOrderProducts = await Purchase_Order_Detail.findAll({
        where: {
          purchaseOrderId: exsistingData?.id,
        },
      });

      for (const item of purchaseOrderProducts) {
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
            `Produk dengan ID ${item.warehouseProductId} tidak ditemukann`
          );
        }

        const newWarehouseQuantity =
          warehouseProduct?.quantity + item?.quantity;

        // Tambah stok product di warehouse
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
            adjustmentType: "PLUS",
            warehouseId: warehouseProduct?.warehouseId,
            userId: user?.id,
            info: "PURCHASE ORDER",
            purchaseOrderId: exsistingData?.id,
            lastQuantity: newWarehouseQuantity, // stock product warehouse tambah product purchase order
          },
          { transaction }
        );

        // Start Calculation For Master Modal
        const findMasterModal = await Master_Modal.findOne({
          where: {
            productId: warehouseProduct?.productId,
            unitId: warehouseProduct?.unitId,
          },
        });

        // Jika tidak ditemukan create
        if (!findMasterModal) {
          /**
           * Rumus Modal
           * Case Jika modal baru
           * create baru dengan harga modal adalah price pada po detail
           * **/
          await Master_Modal.create(
            {
              productId: warehouseProduct?.productId,
              unitId: warehouseProduct?.unitId,
              quantity: item?.quantity,
              amountPurchaseOrder: item?.subTotal, // total harga pembelian barang produk tersebut
              modal: item?.price, // harga modal pembelian
              totalPurchaseOrder: 1, // Iniate total berapa kali purchase order adalah 1
            },
            { transaction }
          );
          // Jika flag isNewModal true, maka rumus modal akan diperbarui
        } else if (item?.isNewModal && findMasterModal) {
          await Master_Modal.update(
            {
              quantity: item?.quantity,
              amountPurchaseOrder: item?.subTotal,
              modal: item?.price,
              totalPurchaseOrder: 1,
            },
            {
              where: {
                id: findMasterModal?.id,
              },
              transaction,
            }
          );

          // Jika ditemukan maka kalkulasi
        } else {
          /**
           * case jika modal sudah ada
           *   - quantity * price -> subTotal
           *   - (subTotal + amountPurchaseOrder master modal) / (quantity PO baru + quantity master modal)
           */

          const updatedQuantity =
            Number(findMasterModal?.quantity) + Number(item?.quantity);
          const updatedAmountPurchaseOrder =
            Number(findMasterModal?.amountPurchaseOrder) +
            Number(item?.subTotal);
          const updatedModal = Math.round(
            Number(updatedAmountPurchaseOrder) / Number(updatedQuantity)
          );

          await Master_Modal.update(
            {
              quantity: updatedQuantity,
              amountPurchaseOrder: updatedAmountPurchaseOrder,
              modal: updatedModal,
              totalPurchaseOrder: findMasterModal?.totalPurchaseOrder + 1,
            },
            {
              where: {
                id: findMasterModal?.id,
              },
              transaction,
            }
          );
        }
      }

      // FIND PRODUCT PURCHASE ORDER BARTER
      const purchaseOrderBarterProducts =
        await Purchase_Order_Barter_Detail.findAll({
          where: {
            purchaseOrderId: exsistingData?.id,
          },
        });

      let totalModal = 0;
      let totalGainLoss = 0;

      // PENGURANGAN PRODUCT HASIL BARTER DARI PRODUCT WAREHOUSE
      if (purchaseOrderBarterProducts?.length > 0) {
        for (const item of purchaseOrderBarterProducts) {
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
              `Produk dengan ID ${item.warehouseProductId} tidak ditemukann`
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

          const newBarterWarehouseQuantity =
            warehouseProduct?.quantity - item?.quantity;

          // tambah stock product di warehouse
          await Warehouse_Product.update(
            {
              quantity: newBarterWarehouseQuantity,
            },
            {
              where: {
                id: item?.warehouseProductId,
              },
              transaction,
            }
          );

          // update Gain Loss pada PO Barter Detail
          const totalModalProduct = Number(item.modal) * Number(item.quantity);
          const gainLossProduct = Number(item.subTotal) - Number(totalModalProduct)

          await Purchase_Order_Barter_Detail.update(
            {
              gainLoss: gainLossProduct,
            },
            {
              where: {
                id: item?.id,
              },
              transaction,
            }
          );

          // Sum for total modal and total gain loss PO
          totalModal += Number(item.modal);
          totalGainLoss += Number(gainLossProduct);

          // catat stock adjustment histories pengurangan
          await Stock_Adjustment_History.create(
            {
              productWarehouseId: item?.warehouseProductId,
              quantity: item?.quantity,
              adjustmentType: "MINUS",
              description: "pengurangan barang keluar dari barang barter",
              warehouseId: warehouseProduct?.warehouseId,
              userId: user?.id,
              info: "PURCHASE ORDER",
              purchaseOrderId: exsistingData?.id,
              lastQuantity: newBarterWarehouseQuantity, // stock product warehouse kurang product purchase order barter
            },
            { transaction }
          );

          // Update Base Modal Jika input harga modal beda dengan base master modal
          const findMasterModal = await Master_Modal.findOne({
            where: {
              productId: warehouseProduct?.productId,
              unitId: warehouseProduct?.unitId,
            },
          });

          if (findMasterModal && item?.modal != findMasterModal?.modal) {
            await Master_Modal.update(
              {
                modal: item?.modal,
                quantity: 1,
                amountPurchaseOrder: item?.modal,
                totalPurchaseOrder: 0,
              },
              {
                where: {
                  id: findMasterModal?.id,
                },
                transaction,
              }
            );
          }

        }
      }

      // UPDATE total modal and total gain loss
      await Purchase_Order.update(
        {
          totalModal,
          totalGainLoss
        },
        {
          where: {
            id: exsistingData?.id
          },
          transaction
        }
      )

      /**
       * Jika grandtotal minus maka vendor harus bayar ke kita maka amountDebt vendor 0
       * Jika grandTotal positif maka lakukan pengurangan totalVendor - totalBarter
       */
      const amountDebt =
        exsistingData?.grandTotal < 0
          ? 0
          : exsistingData?.grandTotalVendor > exsistingData?.grandTotalBarter
            ? Number(exsistingData?.grandTotalVendor) -
            Number(exsistingData?.grandTotalBarter)
            : exsistingData?.grandTotal;

      // CHANGE STATUS PURCHASE ORDER
      const approvedData = await Purchase_Order.update(
        {
          status: "APPROVED",
          approvedBy: user?.id,
          approvedAt: new Date(),
          // update value amount paid to 0 and debt to grandTotal
          amountPaid: 0,
          amountDebt: amountDebt,
        },
        {
          where: {
            code: code,
          },
          transaction,
        }
      );
      // ADD DASHBOARD VENDOR SUMMARY
      const findVendorSummary = await Dashboard_Summary_Vendor.findOne({
        where: {
          vendorId: exsistingData?.vendorId,
        },
      });

      if (findVendorSummary) {
        // update dashboard vendor summary
        /**
         * 1. sum total purchase order
         * 2. sum total amount purchase order vendor made
         * 3. add new total amount debt from latest purchase order
         */
        await Dashboard_Summary_Vendor.update(
          {
            totalPurchaseOrder:
              Number(findVendorSummary.totalPurchaseOrder) + 1,
            totalAmountPurchaseOrder:
              Number(findVendorSummary.totalAmountPurchaseOrder) +
              Number(exsistingData?.grandTotalVendor),
            totalAmountDebtPurchaseOrder:
              Number(findVendorSummary.totalAmountDebtPurchaseOrder) +
              Number(amountDebt),
            totalAmountBarterPurchaseOrder:
              Number(findVendorSummary.totalAmountBarterPurchaseOrder) +
              Number(exsistingData?.grandTotalBarter),
          },
          {
            where: {
              id: findVendorSummary?.id,
            },
            transaction,
          }
        );
      } else {
        // create new vendor dashboard summary
        await Dashboard_Summary_Vendor.create(
          {
            vendorId: exsistingData?.vendorId,
            totalPurchaseOrder: 1,
            totalAmountPurchaseOrder: Number(exsistingData?.grandTotalVendor),
            totalAmountDebtPurchaseOrder: Number(amountDebt),
            totalAmountPaidPurchaseOrder: 0,
            totalAmountBarterPurchaseOrder: Number(
              exsistingData?.grandTotalBarter
            ),
          },
          { transaction }
        );
      }

      await transaction.commit();
      return approvedData;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async reject({ code, user }) {
    try {
      const exsistingData = await Purchase_Order.findOne({
        where: {
          code: code,
        },
      });

      switch (exsistingData?.status) {
        case "APPROVED":
          throwValidation(400, "Data sudah di approve");
        case "REJECTED":
          throwValidation(400, "Data sudah di reject");
        default:
          if (!exsistingData) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }

      const rejectedData = await Purchase_Order.update(
        {
          status: "REJECTED",
          approvedBy: user?.id,
          approvedAt: new Date(),
        },
        {
          where: {
            code: code,
          },
        }
      );

      return rejectedData;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailByCode(code) {
    try {
      const detail = await Purchase_Order.findOne({
        where: { code: code },
        include: [
          {
            model: Master_Vendor,
            include: [
              {
                model: Master_Rank,
                attributes: ["name", "level"],
              },
            ],
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
            model: Master_User,
            as: "approver",
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

      const purchaseOrderProducts = await Purchase_Order_Detail.findAll({
        where: { purchaseOrderId: detail.id },
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

      const purchaseOrderBarterProducts =
        await Purchase_Order_Barter_Detail.findAll({
          where: { purchaseOrderId: detail.id },
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

      const listProduct = purchaseOrderProducts.map((item) => {
        return {
          id: item?.id,
          price: item?.price,
          quantity: item?.quantity,
          subTotal: item?.subTotal,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          productName: item?.Warehouse_Product?.Master_Product?.name,
          companyName:
            item?.Warehouse_Product?.Master_Product?.Master_Company?.name,
          rackName: item?.Warehouse_Product?.Master_Warehouse_Rack?.name,
          warehouseProductId: item?.Warehouse_Product?.id,
          qty: item?.Warehouse_Product?.quantity,
          warehouseName: item?.Warehouse_Product?.Master_Warehouse?.name || "",
          warehouseId: item?.Warehouse_Product?.Master_Warehouse?.id || "",
          isNewModal: item?.isNewModal,
        };
      });

      let listBarterProduct = [];

      if (purchaseOrderBarterProducts.length > 0) {
        listBarterProduct = purchaseOrderBarterProducts.map((item) => {
          return {
            id: item?.id,
            price: item?.price,
            quantity: item?.quantity,
            subTotal: item?.subTotal,
            unitName: item?.Warehouse_Product?.Master_Unit?.name,
            productName: item?.Warehouse_Product?.Master_Product?.name,
            companyName:
              item?.Warehouse_Product?.Master_Product?.Master_Company?.name,
            rackName: item?.Warehouse_Product?.Master_Warehouse_Rack?.name,
            warehouseProductId: item?.Warehouse_Product?.id,
            qty: item?.Warehouse_Product?.quantity,
            warehouseName:
              item?.Warehouse_Product?.Master_Warehouse?.name || "",
            warehouseId: item?.Warehouse_Product?.Master_Warehouse?.id || "",
            modal: item?.modal || 0,
          };
        });
      }

      const sendData = {
        id: detail.id,
        status: detail?.status,
        notes: detail?.notes,
        code: detail.code,
        vendor: {
          id: detail?.vendorId,
          name: detail?.Master_Vendor?.name,
          phoneNumber: detail?.Master_Vendor?.phoneNumber,
          email: detail?.Master_Vendor?.email,
          address: detail?.Master_Vendor?.address,
          gender: detail?.Master_Vendor?.gender,
          rankName: detail?.Master_Vendor?.Master_Rank?.name,
          level: detail?.Master_Vendor?.Master_Rank?.level,
        },
        grandTotal: detail.grandTotal,
        grandTotalVendor: detail.grandTotalVendor,
        grandTotalBarter: detail.grandTotalBarter,
        warehouseLocation: detail?.Master_Warehouse?.location,
        createdBy: detail?.creator?.name,
        approvedBy: detail?.approver?.name,
        approvedAt: detail?.approvedAt,
        createdAt: detail?.createdAt,
        updatedAt: detail?.updatedAt,
        listProducts: listProduct,
        listBarterProducts: listBarterProduct,
        dueDate: detail?.dueDate,
        amountPaid: detail?.amountPaid,
        amountDebt: detail?.amountDebt,
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async updatePurchaseOrder({ data, code }) {
    const transaction = await sq.transaction();
    try {
      const purchaseOrder = await Purchase_Order.findOne({
        where: { code: code },
      });

      switch (purchaseOrder?.status) {
        case "APPROVED":
          throwValidation(400, "Data sudah di approve");
        case "REJECTED":
          throwValidation(400, "Data sudah di reject");
        default:
          if (!purchaseOrder) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }
      for (const item of data?.listProduct) {
        const purchaseOrderDetail = await Purchase_Order_Detail.findByPk(
          item.id,
          {
            transaction,
          }
        );

        if (!purchaseOrderDetail) {
          throwValidation(
            400,
            `Purchase Order detail id ${item.id} tidak ditemukann`
          );
        }

        // Update quantity, price, and sub total in purchase order detail
        await purchaseOrderDetail.update(
          {
            quantity: item.quantity,
            price: item.price,
            subTotal: item.subTotal,
            isNewModal: item.isNewModal,
          },
          { transaction }
        );
      }

      if (data?.listBarterProduct.length > 0) {
        for (const item of data?.listBarterProduct) {
          const purchaseOrderBarterDetail =
            await Purchase_Order_Barter_Detail.findByPk(item.id, {
              transaction,
            });

          if (!purchaseOrderBarterDetail) {
            throwValidation(
              400,
              `Purchase Order Barter detail id ${item.id} tidak ditemukann`
            );
          }

          // Update quantity, price, and sub total in purchase order detail
          await purchaseOrderBarterDetail.update(
            {
              quantity: item.quantity,
              price: item.price,
              subTotal: item.subTotal,
              modal: item.modal,
            },
            { transaction }
          );
        }
      }

      // Update purchase order due date / note / grandTotal
      await Purchase_Order.update(
        {
          dueDate: data?.dueDate,
          notes: data?.notes,
          grandTotal: data?.grandTotal,
          grandTotalBarter: data?.grandTotalBarter,
          grandTotalVendor: data?.grandTotalVendor,
        },
        {
          where: {
            code: code,
          },
          transaction: transaction,
        }
      );

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async getPurchaseOrderByVendorId({ vendorId }) {
    try {
      const allData = await Purchase_Order.findAll({
        where: {
          vendorId: vendorId,
        },
        include: [
          {
            model: Master_Warehouse,
            paranoid: false,
            attributes: ["name"],
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
            model: Master_User,
            as: "approver",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const sendData = allData.map((item) => {
        return {
          id: item.id,
          code: item.code,
          warehouseId: item?.warehouseId,
          warehouseName: item?.Master_Warehouse?.name,
          grandTotal: item?.grandTotal,
          notes: item?.notes,
          status: item?.status,
          createdBy: {
            name: item?.creator?.name,
            roleName: item?.creator?.Master_Role?.name,
          },
          createdAt: item?.createdAt,
          dateCreated: formatDate(item?.createdAt),
          approverBy: {
            name: item?.approver?.name,
            roleName: item?.approver?.Master_Role?.name,
          },
          approvedAt: item?.approvedAt,
          dateApproved: formatDate(item?.approvedAt),
          dueDate: item?.dueDate,
        };
      });

      return sendData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PurchaseOrderService;
