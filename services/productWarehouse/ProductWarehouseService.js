const { formatDate, formatDateWithTime } = require("../../helpers/formatDate");
const { wordingHistory, titleInfo, infoType } = require("../../helpers/producWarehouse/wordingHistory");
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
  Stock_Adjustment_History,
  Delivery_Order,
  Adjustment_Goods_In,
  Adjustment_Goods_Out,
  Master_User,
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
        include: [
          {
            model: Master_Product,
          },
          {
            model: Master_Unit,
          }
        ]
      });

      if (exsistingData.length) {
        const productDuplicate = exsistingData.map((item) => `${item.Master_Product.name}- Unit: ${item.Master_Unit.name}`);
        throw {
          code: 400,
          message: `Produk: ${productDuplicate[0]} sudah ada dalam database`,
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
          lastQuantity: item.quantity,
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
          lastQuantity: existingData.quantity,
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

  static async getHistoryProductWarehouse({ id }) {
    try {
      const data = await Stock_Adjustment_History.findAll({
        where: {
          productWarehouseId: id,
        },
        order: [["id", "DESC"]],
        include: [
          Master_User,
          Delivery_Order,
          Adjustment_Goods_In,
          Adjustment_Goods_Out,
        ],
      });
      const dataProduct = await Warehouse_Product.findOne({
        where: {
          id: id,
        },
        include: [
          Master_Product,
          Master_Unit,
          Master_Warehouse,
          Master_Warehouse_Rack,
        ],
      })

      const mappingHistory = data.map((item) => {
        return {
          title: infoType(item),
          titleInfo: titleInfo(item),
          infoType: infoType(item),
          quantity: item?.quantity,
          date: formatDateWithTime(item?.createdAt).split("-")[0],
          time: formatDateWithTime(item?.createdAt).split("-")[1],
          adjustmentType: item?.adjustmentType,
          ...(item?.info === "TRANSFORMATION PRODUCT" || item?.info === "TRANSFORMATION_PRODUCT") && {
            formula: `Rumus: ${item?.description}`
          },
          ...(item?.info === "GOODS IN") && {
            goodsIn: `Nomor Surat Barang Masuk: ${item?.Adjustment_Goods_In?.code}`
          },
          ...(item?.info === "GOODS OUT") && {
            goodsOut: `Nomor Surat Barang Keluar: ${item?.Adjustment_Goods_Out?.code}`
          },
          ...(item?.info === "DELIVERY ORDER CREATE") && {
            deliveryOrder: `Nomor Surat Jalan: ${item?.Delivery_Order?.deliveryOrderId}`
          },
          ...(item?.info === "DELIVERY ORDER RECEIVE") && {
            deliveryOrder: `Nomor Surat Jalan: ${item?.Delivery_Order?.deliveryOrderId}`
          },
          createdBy: item?.Master_User?.name,
          lastQuantity: item?.lastQuantity
        }
      })

      const mappingProduct = {
        productName: dataProduct?.Master_Product?.name,
        unitName: dataProduct?.Master_Unit?.name,
        rackName: dataProduct?.Master_Warehouse_Rack?.name
      }

      const result = {
        product: mappingProduct,
        history: mappingHistory,
      };
      return result;
    } catch (error) {
      console.log(error);

      throw error;
    }
  }
}

module.exports = ProductWarehouseService;
