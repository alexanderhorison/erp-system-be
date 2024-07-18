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
        }
      })

      // KURANGI PRODUCT AWAL
      originProduct.quantity -= data.qtyTransformation
      await originProduct.save({ transaction });
      await StockAdjustmentHistoryService.createOne({
        data: originProduct,
        user,
        adjustmentType: "MINUS",
        quantity: data.qtyTransformation,
        info: "TRANSFORMATION_PRODUCT",
        description: transformationData?.info,
        transaction,
      });

      if (destinationProduct) {
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
          minimum_stock: 0,
        }, { transaction })

        await StockAdjustmentHistoryService.createOne({
          data: newDestinationProduct,
          user,
          adjustmentType: "INITIATE",
          quantity: (data.qtyTransformation / transformationData.amountFrom) * transformationData.amountTo,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          transaction,
        });
      }
      await transaction.commit();
      return data
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }
}

module.exports = ProductWarehouseTransformationService