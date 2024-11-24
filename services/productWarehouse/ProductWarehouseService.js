const { formatDate, formatDateWithTime } = require("../../helpers/formatDate");
const {
  wordingHistory,
  titleInfo,
  infoType,
} = require("../../helpers/producWarehouse/wordingHistory");
const { generateFilter } = require("../../helpers/queryGenerator");
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
  Stock_Opname,
  Delivery_Order_Receipt_Outstanding,
  Delivery_Order_Receipt,
  Sales_Order,
  Purchase_Order
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
          },
        ],
      });

      if (exsistingData.length) {
        const productDuplicate = exsistingData.map(
          (item) =>
            `${item.Master_Product.name}- Unit: ${item.Master_Unit.name}`
        );
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
        warehouseRackId: data?.Master_Warehouse_Rack?.id,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findProductByWarehouseId({ id, query = {} }) {
    try {
      let queryFilter = {};
      if (query != {}) {
        const filters = [
          {
            column: "categoryId",
            operator: "=",
            value: query.categoryId,
            model: "Master_Product",
          },
          {
            column: "typeId",
            operator: "=",
            value: query.typeId,
            model: "Master_Product",
          },
          {
            column: "companyId",
            operator: "=",
            value: query.companyId,
            model: "Master_Product",
          },
          {
            column: "unitId",
            operator: "=",
            value: query.unitId,
            model: "Warehouse_Product",
          },
          {
            column: "warehouseRackId",
            operator: "=",
            value: query.warehouseRackId,
            model: "Warehouse_Product",
          },
        ];
        queryFilter = generateFilter(filters);
      }

      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId: id,
          ...queryFilter.Warehouse_Product,
        },
        include: [
          {
            model: Master_Product,
            where: queryFilter.Master_Product,
            include: [Master_Category, Master_Type, Master_Company],
          },
          Master_Unit,
          Master_Warehouse,
          Master_Warehouse_Rack,
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
          Stock_Opname,
          Delivery_Order_Receipt_Outstanding,
          Delivery_Order_Receipt,
          Sales_Order,
          Purchase_Order,
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
          {
            model: Master_User,
            attributes: ["id", "name"],
            as: "deleter"
          },
        ],
        paranoid: false,
      });

      const mappingHistory = [];

      for (const item of data) {
        let deliveryOrder = {};
        let deliveryOrderReceipt = {};
        if (item?.info === "OUTSTANDING") {
          const data = await Delivery_Order_Receipt_Outstanding.findOne({
            where: {
              id: item?.deliveryOrderReceiptOutstandingId,
            },
            include: [
              {
                model: Delivery_Order_Receipt,
                attributes: ["id", "code"],
                include: [
                  {
                    model: Delivery_Order,
                    attributes: ["id", "code", "notes"],
                    include: [
                      {
                        model: Master_Warehouse,
                        as: "warehouseOrigin",
                        paranoid: false,
                      },
                      {
                        model: Master_Warehouse,
                        as: "warehouseDestination",
                        paranoid: false,
                      },
                    ],
                  },
                ],
              },
            ],
          });
          deliveryOrder = data?.Delivery_Order_Receipt?.Delivery_Order;
          deliveryOrderReceipt = data?.Delivery_Order_Receipt;
        } else if (
          // Jika delivery order receive menerapkan sistem penerimaan surat jalan yang baru
          item?.info == "DELIVERY ORDER RECEIVE" &&
          item?.deliveryOrderReceiptId
        ) {
          const data = await Delivery_Order_Receipt.findOne({
            where: {
              id: item?.deliveryOrderReceiptId,
            },
            include: [
              {
                model: Delivery_Order,
                attributes: ["id", "code"],
                include: [
                  {
                    model: Master_Warehouse,
                    as: "warehouseOrigin",
                    paranoid: false,
                  },
                  {
                    model: Master_Warehouse,
                    as: "warehouseDestination",
                    paranoid: false,
                  },
                ],
              },
            ],
          });
          deliveryOrder = data?.Delivery_Order;
        }

        if (dataProduct?.deletedAt) {
          mappingHistory.push({
            title: "Produk dihapus",
            infoType: "Produk sudah di hapus",
            deleted: true,
            lastQuantity: dataProduct?.quantity,
            date: formatDateWithTime(dataProduct?.deletedAt).split("-")[0],
            time: formatDateWithTime(dataProduct?.deletedAt).split("-")[1],
            createdBy: dataProduct?.deleter?.name,
          })
        }

        mappingHistory.push({
          title: infoType(item),
          titleInfo: titleInfo(item),
          infoType: infoType(item),
          quantity: item?.quantity,
          date: formatDateWithTime(item?.createdAt).split("-")[0],
          time: formatDateWithTime(item?.createdAt).split("-")[1],
          adjustmentType: item?.adjustmentType,
          ...((item?.info === "TRANSFORMATION PRODUCT" ||
            item?.info === "TRANSFORMATION_PRODUCT") && {
            formula: `Rumus: ${item?.description}`,
          }),
          ...(item?.info === "GOODS IN" && {
            goodsIn: `Barang Masuk: ${item?.Adjustment_Goods_In?.code}`,
            notes: item?.Adjustment_Goods_In?.notes,
            goodsInCode: item?.Adjustment_Goods_In?.code,
          }),
          ...(item?.info === "GOODS OUT" && {
            goodsOut: `Barang Keluar: ${item?.Adjustment_Goods_Out?.code}`,
            notes: item?.Adjustment_Goods_Out?.notes,
            goodsOutCode: item?.Adjustment_Goods_Out?.code,
          }),
          ...(item?.info === "DELIVERY ORDER CREATE" && {
            deliveryOrder: `Surat Jalan: ${item?.Delivery_Order?.code}`,
            notes: item?.Delivery_Order?.notes,
            deliveryOrderCode: item?.Delivery_Order?.code,
          }),
          // ini untuk case yang delivery order receive yang lama
          ...(item?.info === "DELIVERY ORDER RECEIVE" &&
            item?.deliveryOrderId && {
            deliveryOrder: `Surat Jalan: ${item?.Delivery_Order?.code}`,
            notes: item?.Delivery_Order?.notes,
            deliveryOrderCode: item?.Delivery_Order?.code,
          }),
          // ini untuk case yang delivery order receive terbaru
          ...(item?.info === "DELIVERY ORDER RECEIVE" &&
            item?.deliveryOrderReceiptId && {
            deliveryOrderReceipt: `Penerimaan Surat Jalan: ${item?.Delivery_Order_Receipt?.code}`,
            deliveryOrderReceiptCode: item?.Delivery_Order_Receipt?.code,
            deliveryOrder: `Surat Jalan: ${deliveryOrder.code}`,
            notes: item?.Delivery_Order_Receipt?.notes,
            deliveryOrderCode: deliveryOrder.code,
          }),
          ...(item?.info === "STOCK OPNAME" && {
            stockOpname: `Stock Opname: ${item?.Stock_Opname?.code}`,
            notes: item?.Stock_Opname?.notes,
            stockOpnameCode: item?.Stock_Opname?.code,
          }),
          ...(item?.info === "OUTSTANDING" && {
            notes: item?.Delivery_Order_Receipt_Outstanding?.notes,
            outstanding: `Surat Outstanding: ${item?.Delivery_Order_Receipt_Outstanding?.code}`,
            outstandingCode: item?.Delivery_Order_Receipt_Outstanding?.code,
            // deliveryOrder: `Surat Jalan: ${deliveryOrder?.code}`,
            // deliveryOrderCode: deliveryOrder?.code,
            deliveryOrderReceipt: `Penerimaan Surat Jalan: ${deliveryOrderReceipt?.code}`,
            deliveryOrderReceiptCode: deliveryOrderReceipt?.code,
          }),
          // SALES ORDER
          ...(item?.info === "SALES ORDER" && {
            salesOrder: `Sales Order: ${item?.Sales_Order?.code}`,
            description: item?.description,
            notes: item?.Sales_Order?.notes,
            salesOrderCode: item?.Sales_Order?.code,
          }),
          // PURCHASE ORDER
          ...(item?.info === "PURCHASE ORDER" && {
            purchaseOrder: `Purchase Order: ${item?.Purchase_Order?.code}`,
            description: item?.description,
            notes: item?.Purchase_Order?.notes,
            purchaseOrderCode: item?.Purchase_Order?.code,
          }),
          createdBy: item?.Master_User?.name,
          lastQuantity: item?.lastQuantity,
        });
      }

      const mappingProduct = {
        productName: dataProduct?.Master_Product?.name,
        unitName: dataProduct?.Master_Unit?.name,
        rackName: dataProduct?.Master_Warehouse_Rack?.name,
      };

      const result = {
        product: mappingProduct,
        history: mappingHistory,
      };
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getProductInternalTransfer({ id }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId: id,
        },
        include: [
          {
            model: Master_Unit,
            paranoid: false,
            attribute: ["id", "name"],
          },
          {
            model: Master_Warehouse_Rack,
            attribute: ["id", "name"],
          },
          {
            model: Master_Product,
            paranoid: false,
            attribute: ["id", "name"],
            include: [
              {
                model: Master_Category,
                attribute: ["id", "name"],
                paranoid: false,
              },
              {
                model: Master_Company,
                attribute: ["id", "name"],
              },
            ],
          },
        ],
      });

      const result = data.map((item) => {
        return {
          warehouseProductId: item.id,
          productName: `${item.Master_Product.name} - ${item.Master_Unit.name}`,
          categoryName: item.Master_Product.Master_Category.name,
          rackName: item.Master_Warehouse_Rack.name,
          warehouseRackFromId: item.Master_Warehouse_Rack.id,
          unitName: item.Master_Unit.name,
          companyName: item.Master_Product.Master_Company.name,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete({ id, user }) {
    const transaction = await sq.transaction();
    try {
      const exsisting = await Warehouse_Product.findOne({ where: { id: id } });

      if (!exsisting) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }

      const data = await Warehouse_Product.update({
        deletedBy: user?.id || 3,
        info: "DELETED",
        deletedAt: new Date(),
        restoredBy: null,
        restoredAt: null,
      },
        { where: { id } },
        { transaction }
      )


      await transaction.commit();
      return data;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getDeletedProduct({ query }) {
    try {
      let queryFilter = {};
      if (query != {}) {
        const filters = [
          {
            column: "categoryId",
            operator: "=",
            value: query.categoryId,
            model: "Master_Product",
          },
          {
            column: "typeId",
            operator: "=",
            value: query.typeId,
            model: "Master_Product",
          },
          {
            column: "companyId",
            operator: "=",
            value: query.companyId,
            model: "Master_Product",
          },
          {
            column: "unitId",
            operator: "=",
            value: query.unitId,
            model: "Warehouse_Product",
          },
          {
            column: "warehouseRackId",
            operator: "=",
            value: query.warehouseRackId,
            model: "Warehouse_Product",
          },
          {
            column: "warehouseId",
            operator: "=",
            value: query.warehouseId,
            model: "Warehouse_Product",
          }
        ];
        queryFilter = generateFilter(filters);
      }

      const data = await Warehouse_Product.findAll({
        where: {
          ...queryFilter.Warehouse_Product,
          info: "DELETED",
        },
        paranoid: false,
        include: [
          {
            model: Master_Product,
            include: [
              {
                model: Master_Category,
              },
              {
                model: Master_Type,
              },
              {
                model: Master_Company,
              },
            ],
          },
          {
            model: Master_Unit,
          },
          {
            model: Master_Warehouse_Rack,
          },
          {
            model: Master_Warehouse,
          },
          {
            model: Master_User,
            as: "deleter",
          },
        ],
      });

      const result = data.map((item) => {
        return {
          productWarehouseId: item.id,
          productName: item.Master_Product.name,
          categoryName: item.Master_Product.Master_Category.name,
          typeName: item.Master_Product.Master_Type.name,
          unitName: item.Master_Unit.name,
          warehouseName: item.Master_Warehouse.name,
          warehouseId: item?.Master_Warehouse?.id,
          rackName: item?.Master_Warehouse_Rack?.name,
          quantity: item.quantity,
          minimumStock: item.minimumStock,
          companyName: item?.Master_Product?.Master_Company?.name,
          typeName: item?.Master_Product?.Master_Type?.name,
          status: item?.info === "DELETED" ? "Deleted" : "Active",
        };
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async restoreProduct({ id, user }) {
    try {
      const existingData = await Warehouse_Product.findOne({ where: { id: id }, paranoid: false });

      const checkProduct = await Warehouse_Product.findOne({
        where: {
          productId: existingData.productId,
          warehouseId: existingData.warehouseId,
          unitId: existingData.unitId,
        }
      })

      if (checkProduct) {
        throw {
          code: 400,
          message: "Produk sudah ada dalam database",
        };
      }

      const data = await Warehouse_Product.update({
        info: "RESTORED",
        deletedBy: null,
        deletedAt: null,
        restoredBy: user?.id || 3,
        restoredAt: new Date(),
      }, {
        where: {
          id: id
        },
        paranoid: false
      })

      return data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductWarehouseService;
