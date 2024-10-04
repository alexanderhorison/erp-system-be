const moment = require("moment");
const { throwValidation } = require("../../helpers/responses");
const {
  Master_Product,
  Master_Category,
  Master_Unit,
  Master_Warehouse,
  Warehouse_Product,
  Master_Warehouse_Rack,
  Master_Type,
  Master_Company,
  Delivery_Order,
  Adjustment_Goods_In,
  Adjustment_Goods_Out,
  Delivery_Order_Receipt,
  Delivery_Order_Receipt_Outstanding,
  Internal_Transfer,
  Delivery_Order_Receipt_Outstanding_Product,
  sequelize: sq,
} = require("../../models");
const { Op, where } = require("sequelize");
const { formatDate, formatTime } = require("../../helpers/formatDate");

class DashboardService {
  // 1.⁠ ⁠Daftar barang habis -> DONE
  static async minimumStock({ query }) {
    try {
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          quantity: {
            [Op.lte]: sq.col("minimumStock"),
          },
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        attributes: ["id", "quantity", "minimumStock"],
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
            include: [
              { model: Master_Category, attributes: ["name"] },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"] },
          { model: Master_Warehouse, attributes: ["name"] },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        limit: 5,
        order: [["quantity", "ASC"]],
      });

      let result = [];
      if (getWarehouseProduct.length > 0) {
        result = getWarehouseProduct.map((item) => {
          return {
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
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 2.⁠ ⁠TOP 5 barang tidak bergerak  (Tambahkan Config Get data Days) -> DONE
  static async slowStock({ query }) {
    try {
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
            include: [
              { model: Master_Category, attributes: ["name"] },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"] },
          { model: Master_Warehouse, attributes: ["name"] },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        limit: 5,
        order: [["updatedAt", "ASC"]],
      });

      let result = [];
      if (getWarehouseProduct.length > 0) {
        result = getWarehouseProduct.map((item) => {
          return {
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
            dateUpdate: formatDate(item.updatedAt),
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 3.⁠ ⁠Top 5 barang gerak cepat -> DONE
  static async fastStock({ query }) {
    try {
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
            include: [
              { model: Master_Category, attributes: ["name"] },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"] },
          { model: Master_Warehouse, attributes: ["name"] },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        limit: 5,
        order: [["updatedAt", "DESC"]],
      });

      let result = [];
      if (getWarehouseProduct.length > 0) {
        result = getWarehouseProduct.map((item) => {
          return {
            productWarehouseId: item.id,
            productName: item.Master_Product?.name,
            categoryName: item.Master_Product.Master_Category?.name,
            typeName: item.Master_Product.Master_Type?.name,
            unitName: item.Master_Unit?.name,
            warehouseName: item.Master_Warehouse?.name,
            rackName: item?.Master_Warehouse_Rack?.name,
            quantity: item.quantity,
            minimumStock: item.minimumStock,
            companyName: item?.Master_Product?.Master_Company?.name,
            dateUpdate: formatDate(item.updatedAt),
            timeUpdate: formatTime(item.updatedAt),
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 4.⁠ ⁠TOP 5 barang dengan quantity terbanyak (API berubah ngambil data dari suatu unit limit 5 data) Fetch semua Unit (total 25 data) -> DONE
  static async maxQuantityByUnit({ query }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
          unitId: query.unitId,
        },
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
            include: [
              { model: Master_Category, attributes: ["name"] },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"] },
          { model: Master_Warehouse, attributes: ["name"] },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        order: [["unitId", "ASC"], ["quantity", "DESC"]],
        subQuery: false,
      });

      const result = data.reduce((acc, item) => {
        if (!acc[item.unitId]) {
          acc[item.unitId] = {
            unitId: item.unitId,
            name: item.Master_Unit.name,
            products: [],
          };
        }
        if (acc[item.unitId].products.length < 5) {
          acc[item.unitId].products.push({
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
          });
        }
        return acc;
      }, {});

      // Tambahkan logika untuk memeriksa apakah data kosong
      if (data.length === 0) {
        const unit = await Master_Unit.findOne({
          where: { id: query.unitId },
        });
        if (!unit) {
          throw {
            code: 404,
            message: "Unit tidak ditemukan",
          }
        }
        result[query.unitId] = {
          unitId: query.unitId,
          name: unit?.name,
          products: [],
        };
      }

      return Object.values(result);
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 5.⁠ ⁠Statistik total quantity per unit -> DONE
  static async totalQuantityInWarehouse({ query }) {
    try {
      const result = await Warehouse_Product.findAll({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        attributes: [
          "unitId",
          [sq.fn("SUM", sq.col("quantity")), "totalQuantity"],
        ],
        group: ["unitId", "Master_Unit.id"],
        include: [
          {
            model: Master_Unit,
            attributes: ["name"],
          },
        ],
      });

      const formattedResult = result.map((item) => {
        return {
          unitId: item.unitId,
          unitName: item.Master_Unit.name,
          totalQuantity: item.dataValues.totalQuantity,
        };
      });

      return formattedResult;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 6. Statistik jumlah surat terbuat (surat jalan , barang keluar, barang masuk, internal transfer, penerimaan, outstanding) -> DONE
  static async totalSurat({ query }) {
    try {
      const totalDeliveryOrders = await Delivery_Order.count({
        where: {
          ...(query.warehouseOriginId != 0 && { warehouseOriginId: query.warehouseId }),
        }
      });

      const totalGoodsIn = await Adjustment_Goods_In.count({
        where: {
          ...(query.warehouseDestinationId != 0 && { warehouseDestinationId: query.warehouseId }),
        },
      });

      const totalGoodsOut = await Adjustment_Goods_Out.count({
        where: {
          ...(query.warehouseOriginId != 0 && { warehouseOriginId: query.warehouseId }),
        },
      });

      const totalOrderReceipt = await Delivery_Order_Receipt.count({
        include: [
          {
            model: Delivery_Order,
            where: {
              ...(query.warehouseDestinationId != 0 && { warehouseDestinationId: query.warehouseId }),
            }
          }
        ]
      })

      const totalReceiptOutstanding = await Delivery_Order_Receipt_Outstanding.count({
        include: [
          {
            model: Delivery_Order_Receipt,
            required: true,
            include: [
              {
                model: Delivery_Order,
                where: {
                  ...(query.warehouseDestinationId != 0 && { warehouseDestinationId: query.warehouseId }),
                }
              }
            ]
          }
        ]
      });

      const totalInternalTransfer = await Internal_Transfer.count({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
      })

      let result = {
        totalDeliveryOrders: totalDeliveryOrders || 0,
        totalOrderReceipt: totalOrderReceipt || 0,
        totalReceiptOutstanding: totalReceiptOutstanding || 0,
        totalGoodsIn: totalGoodsIn || 0,
        totalGoodsOut: totalGoodsOut || 0,
        totalInternalTransfer: totalInternalTransfer || 0,
      };

      const title = {
        totalDeliveryOrders: "Surat Jalan",
        totalOrderReceipt: "Surat Penerimaan",
        totalReceiptOutstanding: "Surat Outstanding",
        totalGoodsIn: "Surat Barang Masuk",
        totalGoodsOut: "Surat Barang Keluar",
        totalInternalTransfer: "Surat Internal Transfer",
      }

      const url = {
        totalDeliveryOrders: "/delivery-order",
        totalOrderReceipt: "/receive-order",
        totalReceiptOutstanding: "/receipt-order-outstanding",
        totalGoodsIn: "adjustment/goods-in",
        totalGoodsOut: "adjustment/goods-out",
        totalInternalTransfer: "/internal-transfer",
      }

      let arrayResult = Object.keys(result).map(key => ({
        name: key,
        value: result[key],
        title: title[key],
        url: url[key],
      }));

      return arrayResult;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 7. Statistik Jumlah surat yang pending (barang masuk & keluar, internal transfer, outstanding) diselesaikan - DONE
  static async totalSuratPending({ query }) {
    try {
      const totalDeliveryOrders = await Delivery_Order.count({
        where: {
          ...(query.warehouseOriginId != 0 && { warehouseOriginId: query.warehouseId }),
          status: "PENDING",
        }
      });

      const totalGoodsIn = await Adjustment_Goods_In.count({
        where: {
          ...(query.warehouseDestinationId != 0 && { warehouseDestinationId: query.warehouseId }),
          status: "PENDING",
        },
      });

      const totalGoodsOut = await Adjustment_Goods_Out.count({
        where: {
          ...(query.warehouseOriginId != 0 && { warehouseOriginId: query.warehouseId }),
          status: "PENDING",
        },
      });

      const totalReceiptOutstanding = await Delivery_Order_Receipt_Outstanding.count({
        where: {
          status: "PENDING",
        },
        include: [
          {
            model: Delivery_Order_Receipt,
            required: true,
            include: [
              {
                model: Delivery_Order,
                where: {
                  ...(query.warehouseDestinationId != 0 && { warehouseDestinationId: query.warehouseId }),
                }
              }
            ]
          }
        ]
      });

      const totalInternalTransfer = await Internal_Transfer.count({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
          status: "PENDING",
        },
      })

      let result = {
        totalDeliveryOrders: totalDeliveryOrders || 0,
        totalReceiptOutstanding: totalReceiptOutstanding || 0,
        totalGoodsIn: totalGoodsIn || 0,
        totalGoodsOut: totalGoodsOut || 0,
        totalInternalTransfer: totalInternalTransfer || 0,
      };

      const title = {
        "totalDeliveryOrders": "Surat Jalan",
        "totalReceiptOutstanding": "Surat Outstanding",
        "totalGoodsIn": "Surat Barang Masuk",
        "totalGoodsOut": "Surat Barang Keluar",
        "totalInternalTransfer": "Surat Internal Transfer",
      }

      const url = {
        "totalDeliveryOrders": "/delivery-order",
        "totalReceiptOutstanding": "/receipt-order-outstanding",
        "totalGoodsIn": "/adjustment/goods-in",
        "totalGoodsOut": "adjustment/goods-out",
        "totalInternalTransfer": "/internal-transfer",
      }

      let arrayResult = Object.keys(result).map(key => ({
        name: key,
        value: result[key],
        title: title[key],
        url: url[key],
      }));

      return arrayResult;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 8. List product paling banyak hilang dari OUTSTANDING
  static async listMostLostProductAtOutstanding({ query }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        attributes: ["id"],
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
          {
            model: Delivery_Order_Receipt_Outstanding_Product,
            as: "productOutstanding",
            attributes: ["id"],
            where: {
              status: "outstanding",
            },
            include: [
              {
                model: Delivery_Order_Receipt_Outstanding,
                attributes: ["id", "status"],
                where: {
                  status: "APPROVED",
                }
              }
            ]
          }
        ],
      })


      let result = data.map(item => {
        return {
          product: item?.Master_Product?.name,
          unit: item?.Master_Unit?.name,
          totalSuratOutstanding: item?.productOutstanding?.length,
        }
      })

      result.sort((a, b) => {
        return b.totalSuratOutstanding - a.totalSuratOutstanding
      })

      result = result.slice(0, 5)

      return result
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 9. List product paling banyak quantity hilang dari OUTSTANDING
  static async listMostLostProductAtOutstandingByQuantity({ query }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          ...(query?.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
        attributes: ["id"],
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
          {
            model: Delivery_Order_Receipt_Outstanding_Product,
            attributes: ["outstandingQuantity"],
            where: {
              status: "outstanding",
            },
          }
        ],
      })

      let result = data.map(item => {
        const totalOutstandingQuantity = item.Delivery_Order_Receipt_Outstanding_Products.reduce((acc, item2) => acc + item2.outstandingQuantity, 0) || 0
        return {
          product: item?.Master_Product?.name,
          unit: item?.Master_Unit?.name,
          totalQuantityOutstanding: totalOutstandingQuantity
        }
      })

      result.sort((a, b) => {
        return b.totalQuantityOutstanding - a.totalQuantityOutstanding
      })

      return result.slice(0, 5)
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DashboardService;
