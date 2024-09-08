const {
  sequelize: sq,
  Master_Product,
  Warehouse_Product,
  Master_Unit,
  Delivery_Order,
  Delivery_Order_Product,
  Master_Warehouse_Rack,
  Master_Warehouse,
  Master_User,
  Master_Role,
  Delivery_Order_Receipt,
  Delivery_Order_Receipt_Product,
  Delivery_Order_Receipt_Outstanding,
  Delivery_Order_Receipt_Outstanding_Product,
} = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");
const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");

class DeliveryOrderReceiveService {
  static async updateDeliveryOrder(code, user) {
    const transaction = await sq.transaction();
    try {
      // Check warehouse origin
      const origin = await Delivery_Order.findOne({
        where: {
          code: code,
        },
        include: [
          {
            model: Delivery_Order_Product,
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product,
                  },
                  {
                    model: Master_Unit,
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!origin) {
        throw {
          code: 404,
          message: "Surat jalan tidak ditemukan",
        };
      }

      const productOrigin = origin.Delivery_Order_Products;

      for await (const product of productOrigin) {
        const masterProduct = product.Warehouse_Product.Master_Product;

        const destinationProduct = await Warehouse_Product.findOne({
          where: {
            warehouseId: origin.warehouseDestinationId,
            productId: masterProduct.id,
            unitId: product.Warehouse_Product.unitId,
          },
          transaction,
        });

        if (!destinationProduct) {
          // find default rack
          const defaultRack = await Master_Warehouse_Rack.findOne({
            where: {
              name: "default",
            },
            attributes: ["id"],
          });
          // INITIATE JIKA TIDAK ADA PRODUK DI WAREHOUSE DESTINASI
          const initiated = await Warehouse_Product.create(
            {
              productId: masterProduct.id,
              warehouseId: origin.warehouseDestinationId,
              quantity: product.quantity,
              unitId: product.Warehouse_Product.unitId,
              minimumStock: 1,
              warehouseRackId: defaultRack.id,
            },
            { transaction }
          );

          await StockAdjustmentHistoryService.createOne({
            data: initiated,
            user,
            adjustmentType: "INITIATE",
            quantity: initiated.quantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderId: origin.id,
            lastQuantity: initiated.quantity,
            transaction,
          });
        } else {
          // IN JIKA ADA, LANGSUNG TAMBAHKAN
          destinationProduct.quantity += product.quantity;
          await destinationProduct.save({ transaction });

          await StockAdjustmentHistoryService.createOne({
            data: destinationProduct,
            user,
            adjustmentType: "PLUS",
            quantity: product.quantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderId: origin.id,
            lastQuantity: destinationProduct.quantity,
            transaction,
          });
        }
      }

      // UPDATE STATUS DELIVERY
      origin.status = "DONE";
      origin.receivedAt = new Date();
      origin.receivedBy = user.id;

      await origin.save({ transaction });

      transaction.commit();
      return;
    } catch (error) {
      transaction.rollback();
      throw throwValidation(error.code, error.message);
    }
  }

  static async getAllDeliveryOrderReceive(payload) {
    try {
      let queryOption = {
        include: [
          {
            model: Master_User,
            paranoid: false,
            include: [
              {
                model: Master_Role,
                attributes: ["id", "name"],
              },
            ],
            attributes: ["id", "name"],
            as: "creator",
          },
          {
            model: Delivery_Order,
            attributes: ["id", "code"],
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      const data = await Delivery_Order_Receipt.findAll(queryOption);
      const result = data.map((item) => {
        return {
          id: item.id,
          codeReceipt: item.code,
          codeDeliveryOrder: item.Delivery_Order.code,
          createdAt: formatDate(item.createdAt),
          createdBy: {
            name: item.creator.name,
            roleName: item.creator.Master_Role.name,
          },
          dateCreated: item.createdAt,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async createDeliveryOrderReceive(payload) {
    const transaction = await sq.transaction();
    try {
      const { data, user } = payload;
      const code = await codeGenerator(8, "DOR");
      const codeOutstanding = await codeGenerator(8, "DOO");

      const deliveryOrderReceiveData = {
        code: code,
        deliveryOrderId: data.deliveryOrderId,
        createdBy: user.id,
        notes: data.notes,
      };

      // BUAT SURAT PENERIMAAN
      const createdOrderReceipt = await Delivery_Order_Receipt.create(
        deliveryOrderReceiveData,
        { transaction }
      );

      const listProduct = data.data;

      // produk delivery order receipt
      const deliveryOrderReceiptProduct = [];
      // produk delivery order receipt outstanding (jika ada selisih)
      const deliveryOrderReceiptOutstandingProduct = [];

      // Surat untuk outstanding
      let createdDeliveryReceiptOutstanding = null;

      for await (const item of listProduct) {
        deliveryOrderReceiptProduct.push({
          deliveryOrderReceiptId: createdOrderReceipt.id,
          deliveryOrderProductId: item.deliveryOrderProductId,
          receiveQuantity: item.receiveQuantity,
        });
        // Jika item quantity masuk dengan yang diterima sama maka tidak perlu outstanding
        if (item.quantity != item.receiveQuantity) {
          // Jika belum ada data outstanding maka buat terlebih dahulu untuk generate surat outstanding
          if (!createdDeliveryReceiptOutstanding) {
            createdDeliveryReceiptOutstanding =
              await Delivery_Order_Receipt_Outstanding.create(
                {
                  code: codeOutstanding,
                  deliveryOrderReceiptId: createdOrderReceipt.id,
                  createdBy: user.id,
                  status: "PENDING",
                },
                { transaction }
              );
          }
          deliveryOrderReceiptOutstandingProduct.push({
            deliveryOrderReceiptOutstandingId:
              createdDeliveryReceiptOutstanding.id,
            deliveryOrderProductId: item.deliveryOrderProductId,
            outstandingQuantity: item.quantity - item.receiveQuantity,
          });
        }
      }

      // Buat produk Delivery Order Receipt Product
      await Delivery_Order_Receipt_Product.bulkCreate(
        deliveryOrderReceiptProduct,
        {
          transaction,
        }
      );

      // Buat produk Delivery Order Receipt Outstanding Product
      if (deliveryOrderReceiptOutstandingProduct.length > 0) {
        await Delivery_Order_Receipt_Outstanding_Product.bulkCreate(
          deliveryOrderReceiptOutstandingProduct,
          { transaction }
        );
      }

      // Update quantity produk deliveryOrder
      await this.processDeliveryOrderReceive(
        {
          deliveryOrderId: data.deliveryOrderId,
          deliveryOrderReceiptProduct: deliveryOrderReceiptProduct,
          deliveryOrderReceiptId: createdOrderReceipt.id,
          user,
        },
        transaction
      );

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throwValidation(error.code, error.message);
    }
  }

  static async processDeliveryOrderReceive(payload, transaction) {
    try {
      // Check warehouse origin
      const origin = await Delivery_Order.findOne({
        where: {
          id: payload.deliveryOrderId,
        },
        include: [
          {
            model: Delivery_Order_Product,
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product,
                  },
                  {
                    model: Master_Unit,
                  },
                ],
              },
            ],
          },
        ],
      });

      const productOrigin = origin.Delivery_Order_Products;

      for await (const product of productOrigin) {
        const masterProduct = product.Warehouse_Product.Master_Product;

        const destinationProduct = await Warehouse_Product.findOne({
          where: {
            warehouseId: origin.warehouseDestinationId,
            productId: masterProduct.id,
            unitId: product.Warehouse_Product.unitId,
          },
          transaction,
        });

        // find receive quantity
        const findReceipt = payload.deliveryOrderReceiptProduct.find(
          (el) => el.deliveryOrderProductId === product.id
        );

        if (!destinationProduct) {
          // find default rack
          const defaultRack = await Master_Warehouse_Rack.findOne({
            where: {
              name: "default",
            },
            attributes: ["id"],
          });

          // INITIATE JIKA TIDAK ADA PRODUK DI WAREHOUSE DESTINASI
          const initiated = await Warehouse_Product.create(
            {
              productId: masterProduct.id,
              warehouseId: origin.warehouseDestinationId,
              quantity: findReceipt.receiveQuantity, // sesuaikan dengan quantity yang diterima
              unitId: product.Warehouse_Product.unitId,
              minimumStock: 1,
              warehouseRackId: defaultRack.id,
            },
            { transaction }
          );

          await StockAdjustmentHistoryService.createOne({
            data: initiated,
            user: payload.user,
            adjustmentType: "INITIATE",
            quantity: initiated.quantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderReceiptId: payload.deliveryOrderReceiptId,
            lastQuantity: initiated.quantity,
            transaction,
          });
        } else {
          // IN JIKA ADA, LANGSUNG TAMBAHKAN
          destinationProduct.quantity += findReceipt.receiveQuantity;
          await destinationProduct.save({ transaction });

          await StockAdjustmentHistoryService.createOne({
            data: destinationProduct,
            user: payload.user,
            adjustmentType: "PLUS",
            quantity: findReceipt.receiveQuantity,
            info: "DELIVERY ORDER RECEIVE",
            deliveryOrderReceiptId: payload.deliveryOrderReceiptId,
            lastQuantity: destinationProduct.quantity,
            transaction,
          });
        }
      }
      // UPDATE STATUS DELIVERY
      origin.status = "DONE";
      origin.receivedAt = new Date();
      origin.receivedBy = payload.user.id;

      await origin.save({ transaction });
      return;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDetailDeliveryOrderReceive(code) {
    try {
      // find Delivery Order
      const data = await Delivery_Order_Receipt.findOne({
        where: {
          code: code,
        },
        include: [
          {
            model: Delivery_Order,
            include: [
              {
                model: Master_Warehouse,
                as: "warehouseOrigin",
                attributes: ["name", "location"],
              },
              {
                model: Master_Warehouse,
                as: "warehouseDestination",
                attributes: ["name", "location"],
              },
              {
                model: Master_User,
                attributes: ["name"],
                as: "creatorBy",
              },
              {
                model: Master_User,
                attributes: ["name"],
                as: "receiverBy",
              },
            ],
          },
        ],
      });

      // find products
      const products = await Delivery_Order_Receipt_Product.findAll({
        where: {
          deliveryOrderReceiptId: data.id,
        },
        include: [
          {
            model: Delivery_Order_Product,
            attributes: ["quantity"],
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product,
                    attributes: ["id", "name"],
                  },
                  {
                    model: Master_Unit,
                    attributes: ["name"],
                  },
                  {
                    model: Master_Warehouse_Rack,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
      });

      const listProducts = [];

      for await (const item of products) {
        const id =
          item?.Delivery_Order_Product?.Warehouse_Product?.warehouseRackId;

        const findRack = await Master_Warehouse_Rack.findOne({
          where: {
            id,
          },
          attributes: ["name"],
        });

        listProducts.push({
          productName:
            item.Delivery_Order_Product?.Warehouse_Product?.Master_Product
              ?.name,
          rackName: findRack.name,
          unitName:
            item.Delivery_Order_Product?.Warehouse_Product?.Master_Unit?.name,
          quantity: item.Delivery_Order_Product.quantity,
          receiveQuantity: item.receiveQuantity,
        });
      }

      let sendData = {
        id: data?.id,
        codeReceipt: data.code,
        codeDeliveryOrder: data.Delivery_Order?.code,
        warehouseOrigin: {
          name: data.Delivery_Order?.warehouseOrigin?.name,
          location: data.Delivery_Order?.warehouseOrigin?.location,
        },
        warehouseDestination: {
          name: data.Delivery_Order?.warehouseDestination?.name,
          location: data.Delivery_Order?.warehouseDestination?.location,
        },
        listProducts: listProducts,
        notes: data.notes,
        creatorBy: {
          name: data.Delivery_Order?.creatorBy?.name,
        },
        receiverBy: {
          name: data.Delivery_Order?.receiverBy?.name,
        },
        createdAt: data?.Delivery_Order?.createdAt,
        receivedAt: data?.Delivery_Order?.receivedAt,
      };

      return sendData;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderReceiveService;
