const {
  sequelize: sq,
  Master_Product,
  Warehouse_Product,
  Master_Unit,
  Delivery_Order,
  Delivery_Order_Product,
  Master_Warehouse_Rack,
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
                    model: Master_Product
                  },
                  {
                    model: Master_Unit
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

      const productOrigin = origin.Delivery_Order_Products

      for await (const product of productOrigin) {

        const masterProduct = product.Warehouse_Product.Master_Product

        const destinationProduct = await Warehouse_Product.findOne({
          where: {
            warehouseId: origin.warehouseDestinationId,
            productId: masterProduct.id,
            unitId: product.Warehouse_Product.unitId
          },
          transaction
        })

        if (!destinationProduct) {

          // find default rack
          const defaultRack = await Master_Warehouse_Rack.findOne({
            where: {
              name: 'default'
            },
            attributes: ["id"]
          })
          // INITIATE JIKA TIDAK ADA PRODUK DI WAREHOUSE DESTINASI
          const initiated = await Warehouse_Product.create({
            productId: masterProduct.id,
            warehouseId: origin.warehouseDestinationId,
            quantity: product.quantity,
            unitId: product.Warehouse_Product.unitId,
            minimumStock: 1,
            warehouseRackId: defaultRack.id
          }, { transaction })

          await StockAdjustmentHistoryService.createOne({
            data: initiated,
            user,
            adjustmentType: "INITIATE",
            quantity: initiated.quantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderId: deliveryOrderId,
            transaction,
          })

        } else {
          // IN JIKA ADA, LANGSUNG TAMBAHKAN
          destinationProduct.quantity += product.quantity
          destinationProduct.save({ transaction })

          await StockAdjustmentHistoryService.createOne({
            data: destinationProduct,
            user,
            adjustmentType: "PLUS",
            quantity: product.quantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderId: deliveryOrderId,
            transaction,
          })
        }
      }

      // UPDATE STATUS DELIVERY
      origin.status = "DONE"
      origin.receivedAt = new Date()
      origin.receivedBy = user.id

      await origin.save({ transaction })

      transaction.commit()
      return;
    } catch (error) {
      transaction.rollback()
      throw throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderReceiveService;
