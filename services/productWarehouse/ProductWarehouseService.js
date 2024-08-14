const {
  sequelize: sq,
  Master_Product,
  Master_Type,
  Master_Category,
  Warehouse_Product,
  Master_Unit,
  Master_Warehouse,
  Master_Warehouse_Rack,
  Master_Company,
} = require("../../models");
const MasterDataWarehouseService = require("../masterData/MasterDataWarehouseService");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class ProductWarehouseService {
  static async create(data, user, warehouseId) {
    const transaction = await sq.transaction();
    try {
      const listProduct = data.map((item) => item.masterProductId);
      const listUnit = data.map((item) => item.unitId);

      const exsistingData = await Warehouse_Product.findAll({
        where: {
          productId: listProduct,
          unitId: listUnit,
          warehouseId: warehouseId,
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
          productId: item.masterProductId,
          warehouseId: warehouseId,
        };
      });

      const newData = await Warehouse_Product.bulkCreate(createData, {
        transaction,
      });

      const createdHistory = newData.map((item) => {
        return {
          productWarehouseId: item.id,
          quantity: item.quantity,
          warehouseId: item.warehouseId,
          adjustmentType: "INITIATE",
          userId: user.id,
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
      const existingData = await Warehouse_Product.findByPk(id);
      if (!existingData) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }
      // Hanya ubah stock minimum
      if (data.adjustmentType === "MINIMUM_STOCK") {
        existingData.minimumStock = data.minimumStock;
        await existingData.save({ transaction });
      } else {
        if (data.adjustmentType === "PLUS") {
          existingData.quantity += data.quantityAdjustment;
        }
        if (data.adjustmentType === "MINUS") {
          existingData.quantity -= data.quantityAdjustment;
        }
        await existingData.save({ transaction });
        await StockAdjustmentHistoryService.createOne({
          data: existingData,
          user,
          adjustmentType: data.adjustmentType,
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
      const data = await Warehouse_Product.findOne({
        where: {
          id: id,
        },
        include: [
          {
            model: Master_Product,
            include: [Master_Category, Master_Type],
          },
          Master_Unit,
          Master_Warehouse,
          Master_Warehouse_Rack,
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
        categoryName: data.Master_Product.Master_Category.name,
        typeName: data.Master_Product.Master_Type.name,
        unitName: data.Master_Unit.name,
        warehouseName: data.Master_Warehouse.name,
        quantity: data.quantity,
        minimumStock: data.minimumStock,
        warehouseRackId: data?.Master_Warehouse_Rack?.id
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findProductByWarehouseId({ id, query }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId: id,
          ...(query?.unitId && { unitId: query.unitId }),
          ...(query?.warehouseRackId && { warehouseRackId: query.warehouseRackId }),
        },
        include: [
          {
            model: Master_Product,
            where: {
              ...(query?.typeId && { typeId: query.typeId }),
              ...(query?.companyId && { companyId: query.companyId }),
              ...(query?.categoryId && { categoryId: query.categoryId }),
            },
            include: [Master_Category, Master_Type, Master_Company],
          },
          Master_Unit,
          Master_Warehouse,
          Master_Warehouse_Rack
        ],
      });

      const dataWarehouse = await MasterDataWarehouseService.findOne(id);
      const temp = [];

      data.forEach((item) =>
        temp.push({
          productWarehouseId: item.id,
          productName: item.Master_Product.name,
          categoryName: item.Master_Product.Master_Category.name,
          typeName: item.Master_Product.Master_Type.name,
          unitName: item.Master_Unit.name,
          warehouseName: item.Master_Warehouse.name,
          rackName: item?.Master_Warehouse_Rack?.name,
          quantity: item.quantity,
          minimumStock: item.minimumStock,
          companyName: item?.Master_Product?.Master_Company?.name,
          typeName: item?.Master_Product?.Master_Type?.name,
        })
      );

      temp.sort((a, b) => a.quantity - b.quantity);

      const result = {
        warehouseId: dataWarehouse.id,
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
