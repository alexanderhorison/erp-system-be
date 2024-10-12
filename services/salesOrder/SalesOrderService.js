const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");
const { throwValidation } = require("../../helpers/responses");
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
} = require("../../models");

class SalesOrderService {
  static async getAll({ user }) {
    try {
      const allData = await Sales_Order.findAll({
        where: {
          ...(user?.warehouseId ? { warehouseId: user.warehouseId } : {}),
        },
        include: [
          {
            model: Master_Warehouse,
            paranoid: false,
            attributes: ["name"],
          },
          // {
          //   model: Master_Customer,
          //   include: [
          //     {
          //       model: Master_Rank,
          //       attributes: ["name", "level"],
          //     },
          //   ],
          // },
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

  static async create({ data, user }) {
    const transaction = await sq.transaction();
    try {
      const generateCode = await codeGenerator(8, "SO");

      const createdData = await Sales_Order.create(
        {
          code: generateCode,
          warehouseId: data.warehouseId,
          customerId: data.customerId,
          grandTotal: data.grandTotal,
          notes: data?.notes || "",
          status: "PENDING",
          createdBy: user?.id,
          dueDate: data?.dueDate,
        },
        { transaction }
      );

      const createSalesOrderProducts = [];
      const listProduct = data?.listProduct;

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
        });
      }

      await Sales_Order_Detail.bulkCreate(createSalesOrderProducts, {
        transaction,
      });

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
        });

        if (!warehouseProduct) {
          throwValidation(
            400,
            `Produk dengan ID ${item.warehouseProductId} tidak ditemukann`
          );
        }

        // Lakukan pengecekan stock quantity dengan stok di product warehouse apakah cukup
        if (warehouseProduct.quantity < item.quantity) {
          const productName = warehouseProduct.Master_Product?.name || "Produk";
          const unitName = warehouseProduct.Master_Unit?.name || "unit";
          throwValidation(
            400,
            `Stok product ${productName} - ${unitName} kurang, saat ini berjumlah ${warehouseProduct.quantity}`
          );
        }
        // Kurangi stok product di warehouse
        await Warehouse_Product.update(
          {
            quantity: warehouseProduct?.quantity - item?.quantity,
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
            info: "SALES ORDER",
            salesOrderId: exsistingData?.id,
            lastQuantity: warehouseProduct?.quantity - item?.quantity, // stock product warehouse kurang product sales order
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
          amountPaid: 0,
          amountDebt: exsistingData?.grandTotal,
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
         */
        await Dashboard_Summary_Customer.update(
          {
            totalSalesOrder: Number(findCustomerSummary.totalSalesOrder) + 1,
            totalAmountSalesOrder: Number(findCustomerSummary.totalAmountSalesOrder) + Number(exsistingData?.grandTotal),
            totalAmountDebt: Number(findCustomerSummary.totalAmountDebt) + Number(exsistingData?.grandTotal),
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
            totalAmountSalesOrder: Number(exsistingData?.grandTotal),
            totalAmountDebtSalesOrder: Number(exsistingData?.grandTotal),
            totalAmountPaidSalesOrder: 0
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
            model: Master_Warehouse,
            paranoid: false,
            attributes: ["name", "location"],
          },
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
            ],
          },
        ],
      });

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
        };
      });

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
        warehouseId: detail?.warehouseId,
        warehouseName: detail?.Master_Warehouse?.name,
        warehouseLocation: detail?.Master_Warehouse?.location,
        createdBy: detail?.creator?.name,
        approvedBy: detail?.approver?.name,
        approvedAt: detail?.approvedAt,
        createdAt: detail?.createdAt,
        updatedAt: detail?.updatedAt,
        listProducts: listProduct,
        dueDate: detail?.dueDate,
        amountPaid: detail?.amountPaid,
        amountDebt: detail?.amountDebt,
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
          },
          { transaction }
        );
      }

      // Update sales order due date / note / grandTotal
      await Sales_Order.update(
        {
          dueDate: data?.dueDate,
          notes: data?.notes,
          grandTotal: data?.grandTotal,
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

module.exports = SalesOrderService;
