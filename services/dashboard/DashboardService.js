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
  sequelize: sq,
} = require("../../models");
const { Op } = require("sequelize");
const { formatDate, formatTime } = require("../../helpers/formatDate");

class DashboardService {
  static async minimumStock() {
    try {
      // get product from all warehouse that close to minimum stock
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          quantity: {
            [Op.lte]: sq.col("minimumStock"),
          },
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
        limit: 10,
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
  static async slowStock({ query }) {
    try {
      // get product from all warehouse that hasn't been update
      let days = 1;

      if (query.days) {
        days = query.days;
      }

      const dateThreshold = moment().subtract(days, "days").toDate();

      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          updatedAt: {
            [Op.lt]: dateThreshold, // Find records where updatedAt is older than XX days
          },
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

  static async fastStock({ query }) {
    try {
      // get product from all warehouse that hasn't been update
      // let hours = 10;

      // if (query.hours) {
      //   hours = query.hours;
      // }

      // const timeThresold = moment().subtract(hours, "hours").toDate();

      const getWarehouseProduct = await Warehouse_Product.findAll({
        // where: {
        //   updatedAt: {
        //     [Op.gt]: timeThresold, // Find records updated within the last XX hours
        //   },
        // },
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
            timeUpdate: formatTime(item.updatedAt),
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  static async maxQuantityByUnit() {
    try {
      const maxQuantityPerUnit = await Warehouse_Product.findAll({
        attributes: [
          "unitId",
          [sq.fn("MAX", sq.col("quantity")), "maxQuantity"], // Get the maximum quantity for each unit
        ],
        group: ["unitId"],
        raw: true,
      });

      // Step 2: Retrieve the product details for the max quantity of each unit
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          [Op.or]: maxQuantityPerUnit.map((item) => ({
            unitId: item.unitId,
            quantity: item.maxQuantity, // Find products with the max quantity
          })),
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

  static async totalProductInWarehouse() {
    try {
      // Total Product by SUM Quantity (Exclude the unit)
      const totalQuantityByWarehouse = await Warehouse_Product.findAll({
        attributes: [
          "warehouseId", // Group by warehouseId
          [sq.fn("SUM", sq.col("quantity")), "totalQuantity"], // Sum the quantity for each warehouse
        ],
        group: ["warehouseId", "Master_Warehouse.name"], // Group by warehouseId
        include: [
          {
            model: Master_Warehouse, // Include warehouse details
            attributes: ["name"], // Get warehouse name
          },
        ],
        raw: true, // Use raw to simplify result
        order: [["warehouseId", "ASC"]], // order by warehouseId
      });

      let result = [];
      if (totalQuantityByWarehouse.length > 0) {
        result = totalQuantityByWarehouse.map((item) => {
          return {
            warehouseId: item.warehouseId,
            totalQuantity: item.totalQuantity,
            warehouseName: item["Master_Warehouse.name"], // Rename the key to warehouseName
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  static async totalQuantityByUnitInWarehouse() {
    try {
      // Query to get total product quantity by unit in each warehouse
      const totalQuantityByUnitInWarehouse = await Warehouse_Product.findAll({
        attributes: [
          "warehouseId", // Group by warehouseId
          "unitId", // Group by unitId
          [sq.fn("SUM", sq.col("quantity")), "totalQuantity"], // Sum of quantity
        ],
        group: [
          "warehouseId",
          "unitId",
          "Master_Warehouse.name",
          "Master_Unit.name",
        ], // Group by warehouseId and unitId
        include: [
          {
            model: Master_Warehouse, // Include warehouse details
            attributes: ["name"], // Get warehouse name
          },
          {
            model: Master_Unit, // Include unit details
            attributes: ["name"], // Get unit name
          },
        ],
        order: [
          ["warehouseId", "ASC"],
          ["unitId", "ASC"],
        ], // Order by warehouseId and unitId
        raw: true, // Use raw to simplify result
      });

      const result = [];

      // Map data based by warehouseId
      if (totalQuantityByUnitInWarehouse.length > 0) {
        totalQuantityByUnitInWarehouse.forEach((item) => {
          const { warehouseId, totalQuantity, unitId } = item;
          const warehouse = result.find((w) => w.warehouseId === warehouseId);

          if (warehouse) {
            // If warehouse already exists, push the product info
            warehouse.products.push({
              unitId: unitId,
              totalQuantity: totalQuantity,
              unitName: item["Master_Unit.name"], // Get unit name
            });
          } else {
            // Create a new warehouse entry if it doesn't exist
            result.push({
              warehouseId: warehouseId,
              warehouseName: item["Master_Warehouse.name"], // Get warehouse name
              products: [
                {
                  unitId: unitId,
                  totalQuantity: totalQuantity,
                  unitName: item["Master_Unit.name"], // Get unit name
                },
              ],
            });
          }
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async totalSurat() {
    try {
      // Get Surat Jalan
      const totalDeliveryOrders = await Delivery_Order.count();
      const totalGoodsIn = await Adjustment_Goods_In.count();
      const totalGoodsOut = await Adjustment_Goods_Out.count();
      const totalOrderReceipt = await Delivery_Order_Receipt.count();
      const totalReceiptOutstanding =
        await Delivery_Order_Receipt_Outstanding.count();

      let result = {
        totalDeliveryOrders: totalDeliveryOrders || 0,
        totalGoodsIn: totalGoodsIn || 0,
        totalGoodsOut: totalGoodsOut || 0,
        totalOrderReceipt: totalOrderReceipt || 0,
        totalReceiptOutstanding: totalReceiptOutstanding || 0,
      };

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  static async totalSuratPending() {
    try {
      // Get Surat Jalan
      const totalPendingDeliveryOrders = await Delivery_Order.count({
        where: { status: "PENDING" },
      });
      const totalPendingReceiptOutstanding =
        await Delivery_Order_Receipt_Outstanding.count({
          where: { status: "PENDING" },
        });
      const totalPendingGoodsIn = await Adjustment_Goods_In.count({
        where: { status: "PENDING" },
      });
      const totalPendingGoodsOut = await Adjustment_Goods_Out.count({
        where: { status: "PENDING" },
      });
      const totalPendingInternalTransfer = await Internal_Transfer.count({
        where: { status: "PENDING" },
      });

      let result = {
        deliveryOrders: totalPendingDeliveryOrders || 0,
        receiptOutstanding: totalPendingReceiptOutstanding || 0,
        goodsIn: totalPendingGoodsIn || 0,
        goodsOut: totalPendingGoodsOut || 0,
        internalTransfer: totalPendingInternalTransfer || 0,
      };

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DashboardService;
