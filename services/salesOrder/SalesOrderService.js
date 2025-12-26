const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");
const { throwValidation } = require("../../helpers/responses");
const {
  buildQueryOptions,
  buildPaginationResponse,
} = require("../../helpers/queryBuilderHelper");
const { Op, fn, col, literal } = require("sequelize");
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
  Sales_Order,
  Sales_Order_Detail,
  Master_Customer,
  Stock_Adjustment_History,
  Master_Rank,
  Dashboard_Summary_Customer,
  Sales_Order_Barter_Details,
  Master_Modal,
  Sales_Order_Payment,
  Stock_Loan_Products,
  Stock_Loan_History,
} = require("../../models");
const transporter = require("../../helpers/emailConfig");
const jwt = require("jsonwebtoken");

class SalesOrderService {
  static async getAll({ user, query }) {
    try {
      // Gunakan helper untuk membangun options query dinamis
      const queryOptions = buildQueryOptions(query, {
        searchFields: ["code", "$Master_Customer.name$"],
        statusField: "status",
        dateField: "createdAt",
        enableDate:
          query?.date || query?.dateFrom || query?.dateTo ? true : false,
      });

      // Override date filtering jika ada dateFrom/dateTo
      if (query?.dateFrom || query?.dateTo) {
        const dateCondition = {};

        if (query?.dateFrom) {
          dateCondition[Op.gte] = new Date(query.dateFrom + "T00:00:00.000Z");
        }

        if (query?.dateTo) {
          dateCondition[Op.lte] = new Date(query.dateTo + "T23:59:59.999Z");
        }

        queryOptions.where = queryOptions.where || {};
        queryOptions.where.createdAt = dateCondition;
      }

      const allData = await Sales_Order.findAndCountAll({
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
            model: Master_Customer,
          },
        ],
      });

      const sendData = allData.rows.map((item) => {
        return {
          id: item.id,
          code: item.code,
          // warehouseId: item?.warehouseId,
          // warehouseName: item?.Master_Warehouse?.name,
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
          shippingDate: formatDate(item?.shippingDate),
          shippingTime: item?.shippingDate,
          customer: item?.Master_Customer,
          isLoanStockSO: item?.isLoanStockSO ?? false,
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
      const generateCode = await codeGenerator(8, "SO");

      const createdData = await Sales_Order.create(
        {
          code: generateCode,
          warehouseId: null,
          customerId: data.customerId,
          grandTotal: data.grandTotal,
          grandTotalCustomer: data.grandTotalCustomer,
          grandTotalBarter: data.grandTotalBarter,
          notes: data?.notes || "",
          status: "PENDING",
          createdBy: user?.id,
          dueDate: data?.dueDate,
          shippingDate: data?.shippingDate,
          isLoanStockSO: data?.isLoanStockSO || false,
        },
        { transaction }
      );

      const createSalesOrderProducts = [];
      const createSalesOrderBarterProducts = [];
      const listProduct = data?.listProduct;
      const listBarterProduct = data?.listBarterProduct;

      // ADD List Sales Order Products
      for (const item of listProduct) {
        const findWarehouseProduct = await Warehouse_Product.findByPk(
          item.warehouseProductId
        );

        if (!findWarehouseProduct) {
          throwValidation(400, "Salah satu product warehouse tidak ditemukan");
        }

        // push sales order products
        createSalesOrderProducts.push({
          salesOrderId: createdData.id,
          warehouseProductId: item.warehouseProductId,
          price: item.price,
          quantity: item.quantity,
          subTotal: item.subTotal,
          modal: item.modal,
        });
      }

      // ADD SALES ORDER BARTER PRODUCT
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

          // push sales order products
          createSalesOrderBarterProducts.push({
            salesOrderId: createdData.id,
            warehouseProductId: item.warehouseProductId,
            price: item.price,
            quantity: item.quantity,
            subTotal: item.subTotal,
            isNewModal: item.isNewModal,
          });
        }
      }

      await Sales_Order_Detail.bulkCreate(createSalesOrderProducts, {
        transaction,
      });

      if (createSalesOrderBarterProducts.length > 0) {
        await Sales_Order_Barter_Details.bulkCreate(
          createSalesOrderBarterProducts,
          {
            transaction,
          }
        );
      }

      await transaction.commit();
      return createdData;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async approve({ code, user, fullPayment }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Sales_Order.findOne({
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

      // FIND PRODUCT SALES ORDER
      const salesOrderProducts = await Sales_Order_Detail.findAll({
        where: {
          salesOrderId: exsistingData?.id,
        },
      });

      let totalModal = 0;
      let totalGainLoss = 0;

      for (const item of salesOrderProducts) {
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
            `Produk dengan ID ${item.warehouseProductId} tidak ditemukan`
          );
        }

        // Lakukan pengecekan stock quantity dengan stok di product warehouse apakah cukup (hanya untuk bukan loan stock SO)
        if (warehouseProduct.quantity < item.quantity && !exsistingData.isLoanStockSO) {
          const productName = warehouseProduct.Master_Product?.name || "Produk";
          const unitName = warehouseProduct.Master_Unit?.name || "unit";
          throwValidation(
            400,
            `Stok product ${productName} - ${unitName} kurang, saat ini berjumlah ${warehouseProduct.quantity}`
          );
        }

        let newWarehouseQuantity;
        let loanQuantity = 0;
        let actualSubtractedQuantity = item.quantity;

        // Check if warehouse has enough stock
        if (warehouseProduct.quantity >= item.quantity) {
          // Stock is sufficient, subtract normally
          newWarehouseQuantity = warehouseProduct.quantity - item.quantity;
        } else {
          // Stock is insufficient, need to use loan stock
          actualSubtractedQuantity = warehouseProduct.quantity;
          loanQuantity = item.quantity - warehouseProduct.quantity;
          newWarehouseQuantity = 0; // Cannot go negative
        }

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

        // If there's a loan quantity, handle Stock_Loan_Products and Stock_Loan_History
        if (loanQuantity > 0) {
          // Find or create Stock_Loan_Products entry
          const existingLoanProduct = await Stock_Loan_Products.findOne({
            where: {
              productWarehouseId: item.warehouseProductId,
            },
            transaction,
          });

          if (existingLoanProduct) {
            // Update existing loan quantity
            await Stock_Loan_Products.update(
              {
                quantity: existingLoanProduct.quantity + loanQuantity,
              },
              {
                where: {
                  productWarehouseId: item.warehouseProductId,
                },
                transaction,
              }
            );
          } else {
            // Create new loan product entry
            await Stock_Loan_Products.create(
              {
                productWarehouseId: item.warehouseProductId,
                quantity: loanQuantity,
              },
              { transaction }
            );
          }

          // Check if INITIATE history exists for this product
          const initiateHistory = await Stock_Loan_History.findOne({
            where: {
              productWarehouseId: item.warehouseProductId,
              adjustmentType: "INITIATE",
            },
            transaction,
          });

          // Create INITIATE history if it doesn't exist
          if (!initiateHistory) {
            await Stock_Loan_History.create(
              {
                productWarehouseId: item.warehouseProductId,
                quantity: 0,
                adjustmentType: "INITIATE",
                warehouseId: warehouseProduct.warehouseId,
                userId: user.id,
                description: "Initiate loan stock tracking",
                info: "SALES ORDER LOAN",
                salesOrderId: exsistingData.id,
              },
              { transaction }
            );
          }

          // Create PLUS history for the loan
          await Stock_Loan_History.create(
            {
              productWarehouseId: item.warehouseProductId,
              quantity: loanQuantity,
              adjustmentType: "PLUS",
              warehouseId: warehouseProduct.warehouseId,
              userId: user.id,
              description: `Loan stock for Sales Order ${exsistingData.code}`,
              info: "SALES ORDER LOAN",
              salesOrderId: exsistingData.id,
            },
            { transaction }
          );
        }

        // update Gain Loss pada SO Detail

        // modal product -> modal * quantity
        const totalModalProduct = Number(item.modal) * Number(item.quantity);
        // Gain loss product Harga jual - Harga beli
        const gainLossProduct =
          Number(item.subTotal) - Number(totalModalProduct);

        await Sales_Order_Detail.update(
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

        // Sum for total modal and total gain loss SO
        totalModal += Number(item.modal);
        totalGainLoss += Number(gainLossProduct);

        // catat stock adjustment histories (only for actual subtracted quantity)
        if (actualSubtractedQuantity > 0) {
          await Stock_Adjustment_History.create(
            {
              productWarehouseId: item?.warehouseProductId,
              quantity: actualSubtractedQuantity,
              adjustmentType: "MINUS",
              warehouseId: warehouseProduct?.warehouseId,
              userId: user?.id,
              info: "SALES ORDER",
              salesOrderId: exsistingData?.id,
              lastQuantity: newWarehouseQuantity, // stock product warehouse kurang product sales order
            },
            { transaction }
          );
        }

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

      // UPDATE total modal and total gain loss
      await Sales_Order.update(
        {
          totalModal,
          totalGainLoss,
        },
        {
          where: {
            id: exsistingData?.id,
          },
          transaction,
        }
      );

      // FIND PRODUCT SALES ORDER BARTER
      const salesOrderBarterProducts = await Sales_Order_Barter_Details.findAll(
        {
          where: {
            salesOrderId: exsistingData?.id,
          },
        }
      );

      // PENAMBAHAN PRODUCT HASIL BARTER KE PRODUCT WAREHOUSE
      if (salesOrderBarterProducts?.length > 0) {
        for (const item of salesOrderBarterProducts) {
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

          const newBarterWarehouseQuantity =
            warehouseProduct?.quantity + item?.quantity;

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

          // catat stock adjustment histories penambahan
          await Stock_Adjustment_History.create(
            {
              productWarehouseId: item?.warehouseProductId,
              quantity: item?.quantity,
              adjustmentType: "PLUS",
              description: "penambahan barang masuk dari barang barter",
              warehouseId: warehouseProduct?.warehouseId,
              userId: user?.id,
              info: "SALES ORDER",
              salesOrderId: exsistingData?.id,
              lastQuantity: newBarterWarehouseQuantity, // stock product warehouse kurang product sales order
            },
            { transaction }
          );

          // Start calculation For Master Modal
          const findMasterModal = await Master_Modal.findOne({
            where: {
              productId: warehouseProduct?.productId,
              unitId: warehouseProduct?.unitId,
            },
          });

          // Jika tidak ditemukan create
          if (!findMasterModal) {
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
          } else {
            // Jika ditemukan maka kalkulasi

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
      }

      /**
       * Jika grandtotal minus atau owner harus bayar maka amountDebt customer 0
       * Jika grandTotal positif maka lakukan pengurangan totalCustomer - totalBarter
       */
      const amountDebt =
        exsistingData?.grandTotal < 0
          ? 0
          : exsistingData?.grandTotalCustomer > exsistingData?.grandTotalBarter
          ? Number(exsistingData?.grandTotalCustomer) -
            Number(exsistingData?.grandTotalBarter)
          : exsistingData?.grandTotal;

      // JIKA FULL PAYMENT = TRUE MAKA ANGGAPAN CUSTOMER LANGSUNG LUNAS
      const finalAmountDebt = fullPayment ? 0 : amountDebt;
      const finalAmountPaid = fullPayment ? amountDebt : 0;

      // JIKA LUNAS DAN ADA PEMBAYARAN
      if (fullPayment && finalAmountPaid !== 0) {
        await Sales_Order_Payment.create(
          {
            typePayment: "CASH",
            amount: finalAmountPaid,
            notes: "Dibayar Lunas saat approve sales order ",
            salesOrderId: exsistingData?.id,
            createdBy: user?.id,
          },
          { transaction }
        );
      }

      // CHANGE STATUS SALES ORDER
      const approvedData = await Sales_Order.update(
        {
          status: "APPROVED",
          approvedBy: user?.id,
          approvedAt: new Date(),
          // update value amount paid to 0 and debt to grandTotal
          amountPaid: finalAmountPaid,
          amountDebt: finalAmountDebt,
        },
        {
          where: {
            code: code,
          },
          transaction,
        }
      );
      // ADD DASHBOARD CUSTOMER SUMMARY
      const findCustomerSummary = await Dashboard_Summary_Customer.findOne({
        where: {
          customerId: exsistingData?.customerId,
        },
      });

      if (findCustomerSummary) {
        // update dashboard customer summary
        /**
         * 1. sum total sales order
         * 2. sum total amount sales order customer made
         * 3. add new total amount debt from latest sales order
         * 4. add new total amount barter if exist
         */
        await Dashboard_Summary_Customer.update(
          {
            totalSalesOrder: Number(findCustomerSummary.totalSalesOrder) + 1,
            totalAmountSalesOrder:
              Number(findCustomerSummary.totalAmountSalesOrder) +
              Number(exsistingData?.grandTotalCustomer),
            totalAmountDebtSalesOrder:
              Number(findCustomerSummary.totalAmountDebtSalesOrder) +
              Number(finalAmountDebt),
            totalAmountPaidSalesOrder:
              Number(findCustomerSummary.totalAmountPaidSalesOrder) +
              Number(finalAmountPaid),
            totalAmountBarterSalesOrder:
              Number(findCustomerSummary.totalAmountBarterSalesOrder) +
              Number(exsistingData?.grandTotalBarter),
          },
          {
            where: {
              id: findCustomerSummary?.id,
            },
            transaction,
          }
        );
      } else {
        // create new customer dashboard summary
        await Dashboard_Summary_Customer.create(
          {
            customerId: exsistingData?.customerId,
            totalSalesOrder: 1,
            totalAmountSalesOrder: Number(exsistingData?.grandTotalCustomer),
            totalAmountDebtSalesOrder: Number(finalAmountDebt),
            totalAmountPaidSalesOrder: Number(finalAmountPaid),
            totalAmountBarterSalesOrder: Number(
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
      const exsistingData = await Sales_Order.findOne({
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

      const rejectedData = await Sales_Order.update(
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
      const detail = await Sales_Order.findOne({
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

      const salesOrderProducts = await Sales_Order_Detail.findAll({
        where: { salesOrderId: detail.id },
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

      const salesOrderBarterProducts = await Sales_Order_Barter_Details.findAll(
        {
          where: { salesOrderId: detail.id },
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
        }
      );

      const listProduct = salesOrderProducts.map((item) => {
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
          modal: item?.modal || 0,
        };
      });

      let listBarterProduct = [];

      if (salesOrderBarterProducts.length > 0) {
        listBarterProduct = salesOrderBarterProducts.map((item) => {
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
            isNewModal: item?.isNewModal,
          };
        });
      }

      const sendData = {
        id: detail.id,
        status: detail?.status,
        notes: detail?.notes,
        code: detail.code,
        customer: {
          id: detail?.customerId,
          name: detail?.Master_Customer?.name,
          phoneNumber: detail?.Master_Customer?.phoneNumber,
          email: detail?.Master_Customer?.email,
          address: detail?.Master_Customer?.address,
          gender: detail?.Master_Customer?.gender,
          rankName: detail?.Master_Customer?.Master_Rank?.name,
          level: detail?.Master_Customer?.Master_Rank?.level,
        },
        grandTotal: detail.grandTotal,
        grandTotalCustomer: detail.grandTotalCustomer,
        grandTotalBarter: detail.grandTotalBarter,
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
        shippingDate: detail?.shippingDate,
        isLoanStockSO: detail?.isLoanStockSO || false,
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async updateSalesOrder({ data, code }) {
    const transaction = await sq.transaction();
    try {
      const salesOrder = await Sales_Order.findOne({
        where: { code: code },
      });

      switch (salesOrder?.status) {
        case "APPROVED":
          throwValidation(400, "Data sudah di approve");
        case "REJECTED":
          throwValidation(400, "Data sudah di reject");
        default:
          if (!salesOrder) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }
      for (const item of data?.listProduct) {
        const salesOrderDetail = await Sales_Order_Detail.findByPk(item.id, {
          transaction,
        });

        if (!salesOrderDetail) {
          throwValidation(
            400,
            `Sales Order detail id ${item.id} tidak ditemukann`
          );
        }

        // Update quantity, price, and sub total in sales order detail
        await salesOrderDetail.update(
          {
            quantity: item.quantity,
            price: item.price,
            subTotal: item.subTotal,
            modal: item.modal,
          },
          { transaction }
        );
      }

      if (data?.listBarterProduct.length > 0) {
        for (const item of data?.listBarterProduct) {
          const salesOrderBarterDetail =
            await Sales_Order_Barter_Details.findByPk(item.id, {
              transaction,
            });

          if (!salesOrderBarterDetail) {
            throwValidation(
              400,
              `Sales Order Barter detail id ${item.id} tidak ditemukann`
            );
          }

          // Update quantity, price, and sub total in sales order detail
          await salesOrderBarterDetail.update(
            {
              quantity: item.quantity,
              price: item.price,
              subTotal: item.subTotal,
              isNewModal: item.isNewModal,
            },
            { transaction }
          );
        }
      }

      // Update sales order due date / note / grandTotal
      await Sales_Order.update(
        {
          dueDate: data?.dueDate,
          notes: data?.notes,
          shippingDate: data?.shippingDate,
          grandTotal: data?.grandTotal,
          grandTotalBarter: data?.grandTotalBarter,
          grandTotalCustomer: data?.grandTotalCustomer,
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

  static async getSalesOrderByCustomerId({ customerId }) {
    try {
      const allData = await Sales_Order.findAll({
        where: {
          customerId: customerId,
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
          shippingDate: item?.shippingDate,
        };
      });

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async runSchedulerReportCustomerWeekly() {
    try {
      /**
       * 1. Cari semua sales order yang sudah di approve berdasarkan 7 hari terakhir
       * 2. Include customer dan rank
       * 3. Group by customerId
       * 4. Sum grandTotalCustomer as totalPurchase
       * 5. Count id as totalTransaction
       * 6. Order by totalPurchase desc
       */
      const today = new Date();
      today.setHours(23, 59, 59, 999); // end of today

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6); // start from 7 days ago including today
      sevenDaysAgo.setHours(0, 0, 0, 0); // start of that day

      console.log(
        `[${today.toISOString()}] Running SCHEDULER_REPORT_CUSTOMER_WEEKLY With Ranking`
      );

      const report = await Sales_Order.findAll({
        where: {
          status: "APPROVED",
          approvedAt: {
            [Op.between]: [sevenDaysAgo, today],
          },
        },
        attributes: [
          "customerId",
          [fn("COUNT", col("Sales_Order.id")), "totalSo"], // fully qualified column
          [
            fn(
              "SUM",
              literal(
                'CASE WHEN "Sales_Order"."grandTotal" > 0 THEN "Sales_Order"."grandTotal" ELSE 0 END'
              )
            ),
            "totalAmount",
          ],
          [
            fn(
              "SUM",
              literal(
                'CASE WHEN "Sales_Order"."amountPaid" > 0 THEN "Sales_Order"."amountPaid" ELSE 0 END'
              )
            ),
            "amountPaid",
          ],
        ],
        include: [
          {
            model: Master_Customer,
            attributes: ["id", "name", "phoneNumber", "email"],
            include: [
              {
                model: Master_Rank,
                attributes: ["name", "level"],
              },
            ],
          },
        ],
        group: [
          "Sales_Order.customerId",
          "Master_Customer.id",
          "Master_Customer->Master_Rank.id",
        ],
        order: [[col("totalAmount"), "DESC"]],
      });

      if (!report || report.length === 0) {
        console.log("No Sales Order data available for the report.");
        return {
          message: "No Sales Order data available for the report.",
          data: [],
        };
      }

      let subjectText = `Report SO Customer periode ${sevenDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;

      const tableRowsArray = await Promise.all(
        report.map(async (row, index) => {
          const data = row.get({ plain: true });

          const token = jwt.sign(
            { customerId: data.customerId },
            process.env.TOKEN_KEY,
            { expiresIn: "3d" }
          );

          const link = `${process.env.BASE_URL}/rank-up-customer?token=${token}`;

          const findNextRank = await Master_Rank.findOne({
            where: {
              level: { [Op.gt]: data.Master_Customer?.Master_Rank?.level || 0 },
            },
            order: [["level", "ASC"]],
          });

          return `
          <tr>
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">${
              index + 1
            }</td>
            <td style="border:1px solid #ccc; padding:8px;">
              ${data.Master_Customer?.name || "-"} 
              (Rank: ${data.Master_Customer?.Master_Rank?.name || "-"})
            </td>
            <td style="border:1px solid #ccc; padding:8px;">${
              findNextRank?.name || "-"
            }</td>
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">${
              data.totalSo
            }</td>
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              Rp. ${Number(data.totalAmount).toLocaleString("id-ID")}
            </td>
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              Rp. ${Number(data.amountPaid).toLocaleString("id-ID")}
            </td>
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              ${
                findNextRank
                  ? `<a href="${link}" 
                target="_blank"
                style="display:inline-block; padding:6px 12px; background:#28a745; color:#fff; text-decoration:none; border-radius:4px;">
                Level Up
             </a>`
                  : "-"
              }
            </td>
          </tr>
        `;
        })
      );

      const tableRows = tableRowsArray.join("");

      const htmlBody = `
        <p>Berikut Hasil Belanja SO Customer:</p>
        <table style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:14px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #ccc; padding:8px;">No</th>
              <th style="border:1px solid #ccc; padding:8px;">Customer Name</th>
              <th style="border:1px solid #ccc; padding:8px;">Next Rank</th>
              <th style="border:1px solid #ccc; padding:8px;">Total SO</th>
              <th style="border:1px solid #ccc; padding:8px;">Total Amount</th>
              <th style="border:1px solid #ccc; padding:8px;">Total Payment</th>
              <th style="border:1px solid #ccc; padding:8px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <br>
        <p>Jika ingin menaikkan level customer klik pada tombol action</p>
      `;

      const transporterConnection = await transporter();

      const msg = {
        from: process.env.EMAIL_IS, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        bcc: process.env.EMAIL_RECEIVER_BCC, // BCC email address
        subject: subjectText, // Subject line
        text: `Berikut Hasil Belanja SO Customer`, // plain text body
        html: htmlBody,
      };
      await transporterConnection.sendMail(msg);
      return { message: "Email sent", data: report?.length };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = SalesOrderService;
