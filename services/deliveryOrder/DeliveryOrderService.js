const {
  sequelize: sq,
  Master_Product,
  Master_Category,
  Master_Unit,
  Master_User,
  Master_Warehouse,
  Master_Role,
  Warehouse_Product,
  Delivery_Order,
  Delivery_Order_Product,
} = require("../../models");

const { throwValidation } = require("../../helpers/responses");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");
const { formatDate } = require("../../helpers/formatDate");
const { codeGenerator } = require("../../helpers/codeGenerator");

class DeliveryOrderService {
  static async createDeliveryOrder(payload) {
    const transaction = await sq.transaction();
    try {
      const { data, user } = payload;

      const deliveryOrderId = await codeGenerator();

      const deliveryOrderData = {
        status: "PENDING",
        warehouseOriginId: data.warehouseOriginId,
        warehouseDestinationId: data.warehouseDestinationId,
        notes: data.notes || "",
        createdBy: user.id,
        deliveryOrderId: deliveryOrderId,
      };

      // BUAT SURAT JALAN
      const createdDeliveryOrder = await Delivery_Order.create(
        deliveryOrderData,
        { transaction }
      );

      const listProduct = data.data;

      const deliveryOrderProduct = [];

      const stockjustmentHistory = [];

      listProduct.forEach((item) => {
        deliveryOrderProduct.push({
          deliveryOrderId: createdDeliveryOrder.deliveryOrderId,
          productWarehouseId: item.productWarehouseId,
          quantity: item.qty,
        });

        stockjustmentHistory.push({
          productWarehouseId: item.productWarehouseId,
          quantity: item.qty,
          adjustmentType: "MINUS",
          warehouseId: data.warehouseOriginId,
          userId: user.id,
          info: "DELIVERY ORDER CREATE",
          deliveryOrderId: createdDeliveryOrder.id,
        });
      });

      // BUAT PRODUK YANG TERDAPAT PADA SURAT JALAN
      const createdDeliveryOrderProduct =
        await Delivery_Order_Product.bulkCreate(deliveryOrderProduct, {
          transaction,
        });

      // PENGURANGAN STOCK PADA WAREHOUSE ORIGIN
      for await (const item of deliveryOrderProduct) {
        const existingData = await Warehouse_Product.findByPk(
          item.productWarehouseId,
          { transaction }
        );
        existingData.quantity -= item.quantity;
        await existingData.save({ transaction });
      }

      // PEMBUATAN HISTORY ADJUSTMENT
      await StockAdjustmentHistoryService.bulkCreate({
        data: stockjustmentHistory,
        transaction: transaction,
      });

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throwValidation(error.code, error.message);
    }
  }

  static async getAllDeliveryOrder(payload) {
    try {
      let queryOption = {
        include: [
          {
            model: Master_User,
            paranoid: false,
            include: [
              {
                model: Master_Role,
              },
            ],
            as: "creatorBy"
          },
          {
            model: Master_User,
            paranoid: false,
            include: [
              {
                model: Master_Role,
              },
            ],
            as: "receiverBy"
          },
          {
            model: Master_Warehouse,
            as: "warehouseOrigin",
            foreignKey: "warehouseOriginId",
            paranoid: false,
          },
          {
            model: Master_Warehouse,
            as: "warehouseDestination",
            foreignKey: "warehouseDestinationId",
            paranoid: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      }

      if (payload.user.roleId == 3) {
        queryOption.where = {
          warehouseDestinationId: payload.user.warehouseId
        }
      }

      const data = await Delivery_Order.findAll(queryOption);
      const result = data.map((item) => {
        return {
          id: item.deliveryOrderId,
          deliveryOrderId: item.deliveryOrderId,
          createdAt: formatDate(item.createdAt),
          receivedAt: formatDate(item.receivedAt),
          createdBy: {
            name: item.creatorBy.name,
            roleName: item.creatorBy.Master_Role.name,
          },
          warehouseOrigin: item.warehouseOrigin.name,
          warehouseDestination: item.warehouseDestination.name,
          status: item.status,
          dateCreated: item.createdAt,
          dateReceived: item.receivedAt,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  // FOR ADD PRODUCT AT DELIVERY ORDER
  static async getInvoiceListProduct(warehouseId) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId: warehouseId,
        },
        include: [
          {
            model: Master_Unit,
            paranoid: false,
          },
          {
            model: Master_Product,
            paranoid: false,
          },
          {
            model: Master_Product,
            paranoid: false,
            include: [
              {
                model: Master_Category,
                paranoid: false,
              }
            ]
          },
        ],
      });

      const result = data.map((item) => {
        return {
          productWarehouseId: item.id,
          productName: `${item.Master_Product.name} - ${item.Master_Unit.name}`,
          categoryName: item.Master_Product.Master_Category.name,
          quantity: item.quantity,
          masterProductId: item.Master_Product.id,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDetailDeliveryOrder(deliveryOrderId) {
    try {
      const data = await Delivery_Order.findOne({
        where: {
          deliveryOrderId: deliveryOrderId,
        },
        include: [
          {
            model: Delivery_Order_Product,
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product,
                  },
                  {
                    model: Master_Unit,
                    attributes: ["name"],
                  },
                ],
              },
            ],
          },
          {
            model: Master_Warehouse,
            as: "warehouseOrigin",
            attributes: ["name", "location"],
          },
          {
            model: Master_Warehouse,
            as: "warehouseDestination",
            attributes: ["name", "location"],
          },
          {
            model: Master_User,
            attributes: ["name"],
            as: "creatorBy"
          },
          {
            model: Master_User,
            attributes: ["name"],
            as: "receiverBy"
          },
        ],
      });

      return data;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderService;
