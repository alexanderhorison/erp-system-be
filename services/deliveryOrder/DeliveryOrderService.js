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
  Master_Warehouse_Rack,
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

      const code = await codeGenerator();

      const deliveryOrderData = {
        status: "PENDING",
        warehouseOriginId: data.warehouseOriginId,
        warehouseDestinationId: data.warehouseDestinationId,
        notes: data.notes || "",
        createdBy: user.id,
        code: code,
      };

      // BUAT SURAT JALAN
      const createdDeliveryOrder = await Delivery_Order.create(
        deliveryOrderData,
        { transaction }
      );

      const listProduct = data.data;

      const deliveryOrderProduct = [];

      const stockjustmentHistory = [];
      for await (const item of listProduct) {
        deliveryOrderProduct.push({
          deliveryOrderId: createdDeliveryOrder.id,
          productWarehouseId: item.productWarehouseId,
          quantity: item.qty,
        });

        // CHECK STOCK
        const stockExsisting = await Warehouse_Product.findOne({
          where: {
            id: item.productWarehouseId,
          },
          attributes: ["quantity"],
        });

        stockjustmentHistory.push({
          productWarehouseId: item.productWarehouseId,
          quantity: item.qty,
          adjustmentType: "MINUS",
          warehouseId: data.warehouseOriginId,
          userId: user.id,
          info: "DELIVERY ORDER CREATE",
          deliveryOrderId: createdDeliveryOrder.id,
          lastQuantity: +stockExsisting.quantity - +item.qty,
        });
      }

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
            as: "creatorBy",
          },
          {
            model: Master_User,
            paranoid: false,
            include: [
              {
                model: Master_Role,
              },
            ],
            as: "receiverBy",
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
      };

      if (payload.user.roleId == 3) {
        queryOption.where = {
          warehouseDestinationId: payload.user.warehouseId,
        };
      }
      // query untuk receive order hanya mengambil yang belum selesai
      if (payload.query.receiveOrder) {
        queryOption.where = {
          status: "PENDING"
        }
      }

      const data = await Delivery_Order.findAll(queryOption);
      const result = data.map((item) => {
        return {
          id: item.id,
          code: item.code,
          createdAt: item.createdAt,
          receivedAt: formatDate(item.receivedAt),
          createdBy: {
            name: item.creatorBy.name,
            roleName: item.creatorBy.Master_Role.name,
          },
          warehouseOrigin: item.warehouseOrigin.name,
          warehouseDestination: item.warehouseDestination.name,
          status: item.status,
          dateCreated: formatDate(item.createdAt),
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
            include: [
              {
                model: Master_Category,
                paranoid: false,
              },
            ],
          },
          {
            model: Master_Warehouse_Rack,
            attributes: ["id", "name"],
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
          masterUnitId: item.Master_Unit.id,
          rackName: item.Master_Warehouse_Rack.name,
          unitName: item.Master_Unit.name,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDetailDeliveryOrder(code) {
    try {
      // find Delivery Order
      const data = await Delivery_Order.findOne({
        where: {
          code: code,
        },
        include: [
          {
            model: Master_Warehouse,
            as: "warehouseOrigin",
            paranoid: false,
            attributes: ["name", "location"],
          },
          {
            model: Master_Warehouse,
            as: "warehouseDestination",
            paranoid: false,
            attributes: ["name", "location"],
          },
          {
            model: Master_User,
            attributes: ["name"],
            as: "creatorBy",
          },
          {
            model: Master_User,
            attributes: ["name"],
            as: "receiverBy",
          },
        ],
      });

      // find delivery order products
      const products = await Delivery_Order_Product.findAll({
        where: {
          deliveryOrderId: data.id,
        },
        include: [
          {
            model: Warehouse_Product,
            paranoid: false,
            include: [
              {
                model: Master_Product,
                attributes: ["id", "name"],
              },
              {
                model: Master_Unit,
                attributes: ["name"],
              },
              {
                model: Master_Warehouse_Rack,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      const listProducts = products.map((item) => {
        return {
          productName: item.Warehouse_Product?.Master_Product?.name,
          rackName: item.Warehouse_Product?.Master_Warehouse_Rack?.name,
          unitName: item.Warehouse_Product?.Master_Unit?.name,
          quantity: item.quantity,
          productWarehouseId: item.warehouse_ProductId,
          deliveryOrderProductId: item.id,
        };
      });

      let sendData = {
        code: data.code,
        warehouseOrigin: {
          name: data.warehouseOrigin?.name,
          location: data.warehouseOrigin?.location,
        },
        warehouseDestination: {
          name: data.warehouseDestination?.name,
          location: data.warehouseDestination?.location,
        },
        listProducts: listProducts,
        notes: data.notes,
        creatorBy: {
          name: data.creatorBy?.name,
        },
        receiverBy: {
          name: data.receiverBy?.name,
        },
        createdAt: data?.createdAt,
        receivedAt: data?.receivedAt,
        id: data?.id,
      }

      return sendData;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderService;
