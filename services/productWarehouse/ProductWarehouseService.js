const {
  sequelize: sq,
  Master_Product,
  Master_Product_History,
  Type,
  Category,
  Product_Warehouse,
  Stock_Adjustment_History,
  Unit,
  Warehouse,
} = require("../../models");
const MasterDataWarehouseService = require("../masterData/MasterDataWarehouseService");

class ProductWarehouseService {
  static async create(data, user) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Product_Warehouse.findOne({
        where: {
          ProductId: data.ProductId,
          WarehouseId: data.WarehouseId,
          UnitId: data.UnitId,
        },
      });

      if (exsistingData) {
        throw {
          code: 400,
          message: "Data sudah ada dalam database",
        };
      }

      const newData = await Product_Warehouse.create(
        {
          ProductId: data.ProductId,
          WarehouseId: data.WarehouseId,
          quantity: data.quantity,
          UnitId: data.UnitId,
          minimum_stock: data.minimum_stock,
          description: data?.description,
          info: data?.info,
        },
        { transaction }
      );

      const createHistoryAdjusment = await Stock_Adjustment_History.create(
        {
          ProductWarehouseId: newData.id,
          quantity: newData.quantity,
          adjustment_type: "INITIATE",
          WarehouseId: newData.WarehouseId,
          UserId: user.id,
          description: newData?.description,
          info: newData?.info,
        },
        { transaction }
      );

      await transaction.commit();
      return data;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async adjustProduct({ id, data, user }) {
    try {
      console.log(id, data, user);

      return data;
    } catch (error) {
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

      const temp = data.map((item) => ({
        ProductWarehouseId: item.id,
        productName: item.Master_Product.name,
        categoryName: item.Master_Product.Category.name,
        typeName: item.Master_Product.Type.name,
        unitName: item.Unit.name,
        warehouseName: item.Warehouse.name,
        quantity: item.quantity,
        minimum_stock: item.minimum_stock,
      }));

      const result = {
        WarehouseId: dataWarehouse.id,
        warehouseName: dataWarehouse.name,
        data: temp,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = ProductWarehouseService;
