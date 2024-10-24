const {
  sequelize: sq,
  Master_Product,
  Master_Type,
  Master_Category,
  Warehouse_Product,
  Master_Unit,
  Master_Warehouse,
  Master_Product_Transformation,
  Stock_Adjustment_History,
  Master_Warehouse_Rack,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class ProductWarehouseTransformationService {
  static async getAllListTransformationByProductWarehouseId(id) {
    try {
      const dataProduct = await Warehouse_Product.findOne({
        where: {
          id,
        },
        attributes: ["productId", "unitId"]
      })

      if (!dataProduct) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        }
      }

      const listData = await Master_Product_Transformation.findAll({
        where: {
          masterProductId: dataProduct.productId,
          unitFromId: dataProduct.unitId,
        },
        include: [
          {
            model: Master_Unit,
            as: "unitFrom"
          },
          {
            model: Master_Unit,
            as: "unitTo"
          }
        ]
      })

      return listData
    } catch (error) {
      throw error
    }
  }

  static async transformProduct({ id, data, user }) {
    const transaction = await sq.transaction();
    try {
      const transformationData = await Master_Product_Transformation.findOne({
        where: {
          id: data.masterTransformationId
        }
      })

      const originProduct = await Warehouse_Product.findOne({
        where: {
          id: id,
        }
      });

      const destinationProduct = await Warehouse_Product.findOne({
        where: {
          productId: originProduct.productId,
          unitId: transformationData.unitToId,
          warehouseId: originProduct.warehouseId,
        },
        include: [
          {
            model: Master_Warehouse_Rack,
            attributes: ["name"],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          }
        ]
      })

      let result = {}

      // KURANGI PRODUCT AWAL
      originProduct.quantity -= data.qtyTransformation
      await originProduct.save({ transaction });
      await StockAdjustmentHistoryService.createOne({
        data: originProduct,
        user,
        adjustmentType: "MINUS",
        quantity: data.qtyTransformation,
        info: "TRANSFORMATION PRODUCT",
        description: transformationData?.info,
        lastQuantity: originProduct.quantity,
        transaction,
      });

      if (destinationProduct) {
        // FOR SALES ORDER
        result = {
          warehouseProductId: destinationProduct.id,
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          qty: destinationProduct.quantity + (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          masterProductId: originProduct.productId,
          rackName: destinationProduct.Master_Warehouse_Rack.name,
          unitName: destinationProduct.Master_Unit.name
        }
        // PRODUCT SUDAH ADA
        // TAMBAHKAN PRODUCT TUJUAN
        destinationProduct.quantity += (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo
        await destinationProduct.save({ transaction });
        await StockAdjustmentHistoryService.createOne({
          data: destinationProduct,
          user,
          adjustmentType: "PLUS",
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          lastQuantity: destinationProduct.quantity,
          transaction,
        });
      } else {
        // PRODUCT BELUM ADA
        // BUAT PRODUCT TUJUAN
        const newDestinationProduct = await Warehouse_Product.create({
          productId: originProduct.productId,
          warehouseId: originProduct.warehouseId,
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          unitId: transformationData.unitToId,
          minimumStock: 1,
          // Jika produk baru maka tambahkan ke rack product origin
          warehouseRackId: data.warehouseRackId,
        }, { transaction })

        const product = await Warehouse_Product.findOne({
          where: {
            id: newDestinationProduct.warehouseRackId
          },
          include: [
            {
              model: Master_Warehouse_Rack,
              attributes: ["name"],
            },
            {
              model: Master_Unit,
              attributes: ["name"],
            }
          ],
          transaction
        })

        result = {
          warehouseProductId: newDestinationProduct.id,
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          qty: newDestinationProduct.quantity,
          masterProductId: originProduct.productId,
          rackName: product.Master_Warehouse_Rack.name,
          unitName: product.Master_Unit.name
        }

        await StockAdjustmentHistoryService.createOne({
          data: newDestinationProduct,
          user,
          adjustmentType: "INITIATE",
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          lastQuantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          transaction,
        });
      }
      await transaction.commit();
      return result
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }
}

module.exports = ProductWarehouseTransformationService