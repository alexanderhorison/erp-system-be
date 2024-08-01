const {
  sequelize: sq,
  Master_Product,
  Type,
  Category,
  Product_Warehouse,
  Unit,
  Warehouse,
  Master_Transformation,
  Stock_Adjustment_History,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class ProductWarehouseTransformationService {
  static async getAllListTransformationByProductWarehouseId(id) {
    try {
      const dataProduct = await Product_Warehouse.findOne({
        where: {
          id,
        },
        attributes: ["ProductId", "UnitId"]
      })

      if (!dataProduct) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        }
      }

      const listData = await Master_Transformation.findAll({
        where: {
          MasterProductId: dataProduct.ProductId,
          UnitFromId: dataProduct.UnitId,
        },
        include: [
          {
            model: Unit,
            as: "UnitFrom"
          },
          {
            model: Unit,
            as: "UnitTo"
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
      const transformationData = await Master_Transformation.findOne({
        where: {
          id: data.MasterTransformationId
        }
      })

      const originProduct = await Product_Warehouse.findOne({
        where: {
          id: id,
        }
      });

      const destinationProduct = await Product_Warehouse.findOne({
        where: {
          ProductId: originProduct.ProductId,
          UnitId: transformationData.UnitToId,
          WarehouseId: originProduct.WarehouseId,
        }
      })

      // KURANGI PRODUCT AWAL
      originProduct.quantity -= data.qtyTransformation
      await originProduct.save({ transaction });
      await StockAdjustmentHistoryService.createOne({
        data: originProduct,
        user,
        adjustment_type: "MINUS",
        quantity: data.qtyTransformation,
        info: "TRANSFORMATION_PRODUCT",
        description: transformationData?.info,
        transaction,
      });

      if (destinationProduct) {
        // PRODUCT SUDAH ADA
        // TAMBAHKAN PRODUCT TUJUAN
        destinationProduct.quantity += (data.qtyTransformation / transformationData.amount_from) * transformationData.amount_to
        await destinationProduct.save({ transaction });
        await StockAdjustmentHistoryService.createOne({
          data: destinationProduct,
          user,
          adjustment_type: "PLUS",
          quantity: (data.qtyTransformation / transformationData.amount_from) * transformationData.amount_to,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          transaction,
        });
      } else {
        // PRODUCT BELUM ADA
        // BUAT PRODUCT TUJUAN
        const newDestinationProduct = await Product_Warehouse.create({
          ProductId: originProduct.ProductId,
          WarehouseId: originProduct.WarehouseId,
          quantity: (data.qtyTransformation / transformationData.amount_from) * transformationData.amount_to,
          UnitId: transformationData.UnitToId,
          minimum_stock: 0,
        }, { transaction })

        await StockAdjustmentHistoryService.createOne({
          data: newDestinationProduct,
          user,
          adjustment_type: "INITIATE",
          quantity: (data.qtyTransformation / transformationData.amount_from) * transformationData.amount_to,
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