const {
  sequelize: sq,
  Master_Product,
  Master_Product_History,
  Type,
  Category,
  Product_Warehouse,
  Unit,
  Delivery_Order,
  Product_Delivery_Order,
  User,
  Warehouse,
  Role,
} = require("../../models");

const { throwValidation } = require("../../helpers/responses");
const {
  generateDeliveryOrderId,
} = require("../../helpers/deliveryOrderIdGenerator");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");
const { formatDate } = require("../../helpers/formatDate");
class DeliveryOrderService {
  static async createDeliveryOrder(payload) {
    const transaction = await sq.transaction();
    try {
      const { data, user } = payload;

      const delivery_order_id = await generateDeliveryOrderId();

      const deliveryOrderData = {
        status: "PENDING",
        WarehouseOriginId: data.WarehouseOriginId,
        WarehouseDestinationId: data.WarehouseDestinationId,
        notes: data.notes || "",
        createdBy: user.id,
        delivery_order_id: delivery_order_id,
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
          delivery_order_id: createdDeliveryOrder.delivery_order_id,
          ProductWarehouseId: item.ProductWarehouseId,
          quantity: item.qty,
        });

        stockjustmentHistory.push({
          ProductWarehouseId: item.ProductWarehouseId,
          quantity: item.qty,
          adjustment_type: "MINUS",
          WarehouseId: data.WarehouseOriginId,
          UserId: user.id,
          info: "DELIVERY ORDER",
          delivery_order_id: createdDeliveryOrder.delivery_order_id,
        });
      });

      // BUAT PRODUK YANG TERDAPAT PADA SURAT JALAN
      const createdDeliveryOrderProduct =
        await Product_Delivery_Order.bulkCreate(deliveryOrderProduct, {
          transaction,
        });

      // PENGURANGAN STOCK PADA WAREHOUSE ORIGIN
      for await (const item of deliveryOrderProduct) {
        const existingData = await Product_Warehouse.findByPk(
          item.ProductWarehouseId,
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
      console.log(error);
      throwValidation(error.code, error.message);
    }
  }

  static async getAllDeliveryOrder(payload) {
    try {
      const data = await Delivery_Order.findAll({
        include: [
          {
            model: User,
            paranoid: false,
            include: [
              {
                model: Role,
              },
            ],
          },
          {
            model: Warehouse,
            as: "WarehouseOrigin",
            foreignKey: "WarehouseOriginId",
            paranoid: false,
          },
          {
            model: Warehouse,
            as: "WarehouseDestination",
            foreignKey: "WarehouseDestinationId",
            paranoid: false,
          },
        ],
      });

      const result = data.map((item) => {
        return {
          id: item.delivery_order_id,
          delivery_order_id: item.delivery_order_id,
          createdAt: formatDate(item.createdAt),
          createdBy: {
            name: item.User.name,
            role_name: item.User.Role.name,
          },
          warehouseOrigin: item.WarehouseOrigin.name,
          warehouseDestination: item.WarehouseDestination.name,
          status: item.status,
        };
      });

      return result;
    } catch (error) {
      console.log(error);
      throwValidation(error.code, error.message);
    }
  }

  // FOR ADD PRODUCT AT DELIVERY ORDER
  static async getInvoiceListProduct(WarehouseId) {
    try {
      const data = await Product_Warehouse.findAll({
        where: {
          WarehouseId: WarehouseId,
        },
        include: [
          {
            model: Unit,
            paranoid: false,
          },
          {
            model: Master_Product,
            paranoid: false,
          },
          {
            model: Master_Product,
            paranoid: false,
          },
        ],
      });

      const result = data.map((item) => {
        return {
          ProductWarehouseId: item.id,
          productName: `${item.Master_Product.name} - ${item.Unit.name}`,
          quantity: item.quantity,
          MasterProductId: item.Master_Product.id,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDetailDeliveryOrder(delivery_order_id) {
    try {
      console.log(delivery_order_id);
      const data = await Delivery_Order.findOne({
        where: {
          delivery_order_id: delivery_order_id,
        },
        include: [
          {
            model: Product_Delivery_Order,
            // include: [
            //   {
            //     model: Product_Warehouse,
            //     include: [
            //       {
            //         model: Master_Product
            //       }
            //     ]
            //   }
            // ]
          }
        ]
      })

      return data;
    } catch (error) {
      console.log(error);
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderService;
