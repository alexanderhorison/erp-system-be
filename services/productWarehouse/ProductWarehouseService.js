const {
  sequelize: sq,
  Master_Product,
  Type,
  Category,
  Product_Warehouse,
  Unit,
  Warehouse,
} = require("../../models");
const MasterDataWarehouseService = require("../masterData/MasterDataWarehouseService");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class ProductWarehouseService {
  static async create(data, user) {
    const transaction = await sq.transaction();
    try {
      const listProduct = data.map((item) => item.MasterProductId);
      const listUnit = data.map((item) => item.UnitId);

      const exsistingData = await Product_Warehouse.findAll({
        where: {
          ProductId: listProduct,
          UnitId: listUnit,
          WarehouseId: user.WarehouseId,
        },
      });

      if (exsistingData.length) {
        throw {
          code: 400,
          message: "Data sudah ada dalam database",
        };
      }

      const createData = data.map((item) => {
        return {
          ...item,
          ProductId: item.MasterProductId,
          WarehouseId: user.WarehouseId,
        };
      });

      const newData = await Product_Warehouse.bulkCreate(createData, {
        transaction,
      });

      const createdHistory = newData.map((item) => {
        return {
          ProductWarehouseId: item.id,
          quantity: item.quantity,
          WarehouseId: item.WarehouseId,
          adjustment_type: "INITIATE",
          UserId: user.id,
        };
      });

      await StockAdjustmentHistoryService.bulkCreate({
        data: createdHistory,
        transaction: transaction,
      });

      await transaction.commit();
      return data;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async adjustProduct({ id, data, user }) {
    const transaction = await sq.transaction();
    try {
      const existingData = await Product_Warehouse.findByPk(id);
      if (!existingData) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }
      // Hanya ubah stock minimum
      if (data.adjustment_type === "MINIMUM_STOCK") {
        existingData.minimum_stock = data.minimum_stock;
        await existingData.save({ transaction });
      } else {
        if (data.adjustment_type === "PLUS") {
          existingData.quantity += data.quantityAdjustment;
        }
        if (data.adjustment_type === "MINUS") {
          existingData.quantity -= data.quantityAdjustment;
        }
        await existingData.save({ transaction });
        await StockAdjustmentHistoryService.createOne({
          data: existingData,
          user,
          adjustment_type: data.adjustment_type,
          quantity: data.quantityAdjustment,
          transaction,
        });
      }
      await transaction.commit();
      return data;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async findOne({ id }) {
    try {
      const data = await Product_Warehouse.findOne({
        where: {
          id: id,
        },
        include: [
          {
            model: Master_Product,
            include: [Category, Type],
          },
          Unit,
          Warehouse,
        ],
      });

      if (!data) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }

      const result = {
        id: data.id,
        productName: data.Master_Product.name,
        categoryName: data.Master_Product.Category.name,
        typeName: data.Master_Product.Type.name,
        unitName: data.Unit.name,
        warehouseName: data.Warehouse.name,
        quantity: data.quantity,
        minimum_stock: data.minimum_stock,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findProductByWarehouseId({ id }) {
    try {
      const data = await Product_Warehouse.findAll({
        where: {
          WarehouseId: id,
        },
        include: [
          {
            model: Master_Product,
            include: [Category, Type],
          },
          Unit,
          Warehouse,
        ],
      });

      const dataWarehouse = await MasterDataWarehouseService.findOne(id);
      const temp = [];

      data.forEach((item) =>
        temp.push({
          ProductWarehouseId: item.id,
          productName: item.Master_Product.name,
          categoryName: item.Master_Product.Category.name,
          typeName: item.Master_Product.Type.name,
          unitName: item.Unit.name,
          warehouseName: item.Warehouse.name,
          quantity: item.quantity,
          minimum_stock: item.minimum_stock,
        })
      );

      const result = {
        WarehouseId: dataWarehouse.id,
        warehouseName: dataWarehouse.name,
        data: temp || [],
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductWarehouseService;
