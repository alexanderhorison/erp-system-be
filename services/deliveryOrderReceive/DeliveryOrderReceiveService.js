const {
  sequelize: sq,
  Master_Product,
  Product_Warehouse,
  Unit,
  Delivery_Order,
  Product_Delivery_Order,
} = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class DeliveryOrderReceiveService {
  static async updateDeliveryOrder(deliveryOrderId, user) {
    const transaction = await sq.transaction();
    try {

      // Check warehouse origin
      const origin = await Delivery_Order.findOne({
        where: {
          delivery_order_id: deliveryOrderId,
        },
        include: [
          {
            model: Product_Delivery_Order,
            include: [
              {
                model: Product_Warehouse,
                include: [
                  {
                    model: Master_Product
                  },
                  {
                    model: Unit
                  }
                ]
              },
            ]
          }
        ],
        transaction
      })

      if (!origin) {
        throw {
          code: 404,
          message: "Surat jalan tidak ditemukan"
        }
      }

      const productOrigin = origin.Product_Delivery_Orders

      for await (const product of productOrigin) {

        const masterProduct = product.Product_Warehouse.Master_Product

        const destinationProduct = await Product_Warehouse.findOne({
          where: {
            WarehouseId: origin.WarehouseDestinationId,
            ProductId: masterProduct.id
          },
          transaction
        })

        if (!destinationProduct) {
          // INITIATE
          const initiated = await Product_Warehouse.create({
            ProductId: masterProduct.id,
            WarehouseId: origin.WarehouseDestinationId,
            quantity: product.quantity,
            UnitId: product.Product_Warehouse.UnitId,
            minimum_stock: 0,
          }, { transaction })

          await StockAdjustmentHistoryService.createOne({
            data: initiated,
            user,
            adjustment_type: "INITIATE",
            quantity: initiated.quantity,
            info: "DELIVERY ORDER RECEIVE",
            delivery_order_id: deliveryOrderId,
            transaction,
          })

        } else {
          // IN
          console.log("MASUK SINI");
          destinationProduct.quantity += product.quantity
          destinationProduct.save({ transaction })

          await StockAdjustmentHistoryService.createOne({
            data: destinationProduct,
            user,
            adjustment_type: "PLUS",
            quantity: product.quantity,
            info: "DELIVERY ORDER RECEIVE",
            delivery_order_id: deliveryOrderId,
            transaction,
          })
        }
      }

      // UPDATE STATUS DELIVERY
      origin.status = "DONE"
      origin.receivedAt = new Date()
      origin.receivedBy = user.id,
        await origin.save({ transaction })

      transaction.commit()
      return;
    } catch (error) {
      transaction.rollback()
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderReceiveService;
