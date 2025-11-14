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
  Stock_Adjustment_History,
  Dashboard_Summary_Customer,
  Dashboard_Summary_Vendor,
  Master_Customer,
  Dashboard_Summary_Pos_Customer,
  sequelize: sq,
} = require("../../models");
const { Op, fn, col } = require("sequelize");
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
          { model: Master_Warehouse, attributes: ["name"], required: true },
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
          { model: Master_Unit, attributes: ["name"], required: true },
          { model: Master_Warehouse, attributes: ["name"], required: true },
          { model: Master_Warehouse_Rack, attributes: ["name"], required: true },
          {
            model: Stock_Adjustment_History, attributes: ["createdAt", "info", "adjustmentType"],
            where: {
              [Op.or]: [
                {
                  info: {
                    [Op.or]: [
                      "DELIVERY ORDER CREATE",
                      "GOODS OUT",
                      "STOCK OPNAME",
                      "SALES ORDER",
                    ]
                  }
                },
                {
                  adjustmentType: {
                    [Op.or]: [
                      "INITIATE",
                      "MINUS",
                    ]
                  }
                }
              ]
            },
            separate: true,
            order: [["createdAt", "DESC"]],
            required: false,
            limit: 1,
          }
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
            warehouseName: item?.Master_Warehouse?.name,
            rackName: item?.Master_Warehouse_Rack?.name,
            quantity: item.quantity,
            minimumStock: item.minimumStock,
            companyName: item?.Master_Product?.Master_Company?.name,
            createdAt: item?.createdAt,
            updatedAt: item?.updatedAt,
            // dateUpdate: `${formatDate(item.updatedAt)} Jam ${formatTime(item.updatedAt)}`,
            dateUpdate: `${formatDate(item.Stock_Adjustment_Histories[0]?.createdAt)} Jam ${formatTime(item.Stock_Adjustment_Histories[0]?.createdAt)}`,
            lastUpdate: item.Stock_Adjustment_Histories[0],
            // lastUpdateinfo: item.Stock_Adjustment_Histories // FOR DEV
          };
        });
      }
      result.sort((a, b) => a.lastUpdate.createdAt - b.lastUpdate.createdAt)
      const finalResult = result.slice(0, 5);
      return finalResult;
    } catch (error) {
      console.log(error);
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
              { model: Master_Category, attributes: ["name"], },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"], required: true },
          { model: Master_Warehouse, attributes: ["name"], required: true },
          { model: Master_Warehouse_Rack, attributes: ["name"], required: true },
          {
            model: Stock_Adjustment_History, attributes: ["createdAt", "info", "adjustmentType"],
            where: {
              [Op.or]: [
                {
                  info: {
                    [Op.or]: [
                      "DELIVERY ORDER CREATE",
                      "GOODS OUT",
                      "STOCK OPNAME",
                      "SALES ORDER",
                    ]
                  }
                },
                {
                  adjustmentType: {
                    [Op.or]: [
                      "MINUS",
                    ]
                  }
                }
              ]
            },
            separate: true,
            order: [["createdAt", "DESC"]],
            required: true,
            limit: 1,
          }
        ],
      });

      let result = [];
      if (getWarehouseProduct.length > 0) {
        getWarehouseProduct.forEach((item) => {
          if (item.Stock_Adjustment_Histories.length !== 0) {
            result.push({
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
              // dateUpdate: `${formatDate(item.updatedAt)} Jam ${formatTime(item.updatedAt)}`,
              updatedAt: `${formatDate(item.updatedAt)} Jam ${formatTime(item.updatedAt)}`,
              dateUpdate: `${formatDate(item.Stock_Adjustment_Histories[0]?.createdAt)} Jam ${formatTime(item.Stock_Adjustment_Histories[0]?.createdAt)}`,
              lastUpdate: item.Stock_Adjustment_Histories[0],
              // lastUpdateinfo: item.Stock_Adjustment_Histories // FOR DEV
            })
          }
        });
      }

      result.sort((a, b) => b.lastUpdate?.createdAt - a.lastUpdate?.createdAt);
      const finalResult = result.slice(0, 5);
      return finalResult;
    } catch (error) {
      console.log(error);
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
          { model: Master_Warehouse, attributes: ["name"], required: true },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        order: [
          ["unitId", "ASC"],
          ["quantity", "DESC"],
        ],
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
          };
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
      let queryWarehouse = query.warehouseId;

      if (query.warehouseId == 0) {
        let warehouse = await Master_Warehouse.findAll({
          attributes: ["id"],
        });
        queryWarehouse = warehouse.map((item) => item.id);
      }

      const result = await Warehouse_Product.findAll({
        where: {
          warehouseId: queryWarehouse,
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
          ...(query.warehouseId != 0 && {
            warehouseOriginId: query.warehouseId,
          }),
        },
      });

      const totalGoodsIn = await Adjustment_Goods_In.count({
        where: {
          ...(query.warehouseId != 0 && {
            warehouseDestinationId: query.warehouseId,
          }),
        },
      });

      const totalGoodsOut = await Adjustment_Goods_Out.count({
        where: {
          ...(query.warehouseId != 0 && {
            warehouseOriginId: query.warehouseId,
          }),
        },
      });

      const totalOrderReceipt = await Delivery_Order_Receipt.count({
        include: [
          {
            model: Delivery_Order,
            where: {
              ...(query.warehouseId != 0 && {
                warehouseDestinationId: query.warehouseId,
              }),
            },
          },
        ],
      });

      const totalReceiptOutstanding =
        await Delivery_Order_Receipt_Outstanding.count({
          include: [
            {
              model: Delivery_Order_Receipt,
              required: true,
              include: [
                {
                  model: Delivery_Order,
                  where: {
                    ...(query.warehouseId != 0 && {
                      warehouseDestinationId: query.warehouseId,
                    }),
                  },
                },
              ],
            },
          ],
        });

      const totalInternalTransfer = await Internal_Transfer.count({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
        },
      });

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
      };

      const url = {
        totalDeliveryOrders: "/delivery-order",
        totalOrderReceipt: "/receive-order",
        totalReceiptOutstanding: "/receipt-order-outstanding",
        totalGoodsIn: "adjustment/goods-in",
        totalGoodsOut: "adjustment/goods-out",
        totalInternalTransfer: "/internal-transfer",
      };

      let arrayResult = Object.keys(result).map((key) => ({
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
      // const totalDeliveryOrders = await Delivery_Order.count({
      //   where: {
      //     ...(query.warehouseId != 0 && { warehouseOriginId: query.warehouseId }),
      //     status: "PENDING",
      //   }
      // });

      const totalGoodsIn = await Adjustment_Goods_In.count({
        where: {
          ...(query.warehouseId != 0 && {
            warehouseDestinationId: query.warehouseId,
          }),
          status: "PENDING",
        },
      });

      const totalGoodsOut = await Adjustment_Goods_Out.count({
        where: {
          ...(query.warehouseId != 0 && {
            warehouseOriginId: query.warehouseId,
          }),
          status: "PENDING",
        },
      });

      const totalReceiptOutstanding =
        await Delivery_Order_Receipt_Outstanding.count({
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
                    ...(query.warehouseId != 0 && {
                      warehouseDestinationId: query.warehouseId,
                    }),
                  },
                },
              ],
            },
          ],
        });

      const totalInternalTransfer = await Internal_Transfer.count({
        where: {
          ...(query.warehouseId != 0 && { warehouseId: query.warehouseId }),
          status: "PENDING",
        },
      });

      let result = {
        // totalDeliveryOrders: totalDeliveryOrders || 0,
        totalReceiptOutstanding: totalReceiptOutstanding || 0,
        totalGoodsIn: totalGoodsIn || 0,
        totalGoodsOut: totalGoodsOut || 0,
        totalInternalTransfer: totalInternalTransfer || 0,
      };

      const title = {
        totalDeliveryOrders: "Surat Jalan",
        totalReceiptOutstanding: "Surat Outstanding",
        totalGoodsIn: "Surat Barang Masuk",
        totalGoodsOut: "Surat Barang Keluar",
        totalInternalTransfer: "Surat Internal Transfer",
      };

      const url = {
        totalDeliveryOrders: "/delivery-order",
        totalReceiptOutstanding: "/receipt-order-outstanding",
        totalGoodsIn: "/adjustment/goods-in",
        totalGoodsOut: "adjustment/goods-out",
        totalInternalTransfer: "/internal-transfer",
      };

      let arrayResult = Object.keys(result).map((key) => ({
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
            model: Master_Warehouse,
            attributes: ["name"],
            required: true,
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
                },
              },
            ],
          },
        ],
      });

      let result = data.map((item) => {
        return {
          productId: item?.id,
          productName: item?.Master_Product?.name,
          unitName: item?.Master_Unit?.name,
          totalSuratOutstanding: item?.productOutstanding?.length,
          warehouseName: item?.Master_Warehouse?.name,
        };
      });

      result.sort((a, b) => {
        return b.totalSuratOutstanding - a.totalSuratOutstanding;
      });

      result = result.slice(0, 5);

      return result;
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
            model: Master_Warehouse,
            attributes: ["name"],
            required: true,
          },
          {
            model: Delivery_Order_Receipt_Outstanding_Product,
            attributes: ["outstandingQuantity"],
            where: {
              status: "outstanding",
            },
          },
        ],
      });

      let result = data.map((item) => {
        const totalOutstandingQuantity =
          item.Delivery_Order_Receipt_Outstanding_Products.reduce(
            (acc, item2) => acc + item2.outstandingQuantity,
            0
          ) || 0;
        return {
          productName: item?.Master_Product?.name,
          unitName: item?.Master_Unit?.name,
          totalQuantityOutstanding: totalOutstandingQuantity,
          warehouseName: item?.Master_Warehouse?.name,
        };
      });

      result.sort((a, b) => {
        return b.totalQuantityOutstanding - a.totalQuantityOutstanding;
      });

      return result.slice(0, 5);
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 10. List summary customer
  static async customerSummary({ customerId }) {
    try {
      /**
       * 1. Get total sales order by customer id
       * 2. Get total amount all sales order
       * 3. Get total amount payment of sales order
       * 4. Get total amount debt of sales order
       * 5. Get total amount barter of sales order
       */

      const result = [];

      const customerType = await Master_Customer.findOne({
        where: {
          id: customerId,
        },
      });

      const isPosCustomer = customerType?.isPosCustomer || false;

      if (isPosCustomer) {
        const customerSummary = await Dashboard_Summary_Pos_Customer.findOne({
          where: {
            customerId,
          },
          include: [
            {
              model: Master_Customer,
            },
          ],
        });
        result.push(
          {
            name: "totalPos",
            value: customerSummary?.totalPos || 0,
            title: "Total POS",
            description: "Total Point of Sales yang sudah dibuat",
          },
          {
            name: "totalAmountPos",
            value: customerSummary?.totalAmountPos || 0,
            title: "Total Nilai POS",
            description: "Total Akumulasi nilai Point of Sales",
          },
          {
            name: "totalAmountPaidPos",
            value: customerSummary?.totalAmountPaidPos || 0,
            title: "Total Pembayaran",
            description: "Total Pembayaran yang sudah dibayarkan",
          },
          {
            name: "totalAmountDebtPos",
            value: customerSummary?.totalAmountDebtPos || 0,
            title: "Total Hutang",
            description: "Total Hutang pembayaran yang belum dibayarkan",
          }
        );
      } else {
        const customerSummary = await Dashboard_Summary_Customer.findOne({
          where: {
            customerId,
          },
          include: [
            {
              model: Master_Customer,
            },
          ],
        });

        result.push(
          {
            name: "totalSalesOrder",
            value: customerSummary?.totalSalesOrder || 0,
            title: "Total Pesanan",
            description: "Total Pesanan yang sudah dipesan",
          },
          {
            name: "totalAmountSalesOrder",
            value: customerSummary?.totalAmountSalesOrder || 0,
            title: "Total Nilai Pesanan",
            description: "Total Akumulasi nilai pesanan",
          },
          {
            name: "totalAmountPaymentSalesOrder",
            value: customerSummary?.totalAmountPaidSalesOrder || 0,
            title: "Total Pembayaran",
            description: "Total Pembayaran yang sudah dibayarkan",
          },
          {
            name: "totalAmountDebtSalesOrder",
            value: customerSummary?.totalAmountDebtSalesOrder || 0,
            title: "Total Hutang",
            description: "Total Hutang pembayaran yang belum dibayarkan",
          },
          {
            name: "totalAmountBarterSalesOrder",
            value: customerSummary?.totalAmountBarterSalesOrder || 0,
            title: "Total Barter",
            description: "Total Akumulasi Nilai Barang yang dibarter",
          }
        );
      }
      // Get All data dashboard summary customer

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 10. List summary vendor
  static async vendorSummary({ vendorId }) {
    try {
      /**
       * 1. Get total purchase order by vendor id
       * 2. Get total amount all purchase order
       * 3. Get total amount payment of purchase order
       * 4. Get total amount debt of purchase order
       * 5. Get total amount barter of purchase order
       */

      const result = [];

      // Get All data dashboard summary vendor
      const vendorSummary = await Dashboard_Summary_Vendor.findOne({
        where: {
          vendorId,
        },
      });

      result.push(
        {
          name: "totalPurchaseOrder",
          value: vendorSummary?.totalPurchaseOrder || 0,
          title: "Total Pesanan",
        },
        {
          name: "totalAmountPurchaseOrder",
          value: vendorSummary?.totalAmountPurchaseOrder || 0,
          title: "Total Nilai Pesanan",
        },
        {
          name: "totalAmountPaymentPurchaseOrder",
          value: vendorSummary?.totalAmountPaidPurchaseOrder || 0,
          title: "Total Pembayaran",
        },
        {
          name: "totalAmountDebtPurchaseOrder",
          value: vendorSummary?.totalAmountDebtPurchaseOrder || 0,
          title: "Total Hutang",
        },
        {
          name: "totalAmountBarterPurchaseOrder",
          value: vendorSummary?.totalAmountBarterPurchaseOrder || 0,
          title: "Total Barter",
        }
      );

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DashboardService;
