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
  Delivery_Order_Receipt_Product,
  Delivery_Order_Receipt_Outstanding,
  Delivery_Order_Receipt_Outstanding_Product,
  Delivery_Order_Receipt,
} = require("../../models");
const { Op } = require("sequelize");
const { throwValidation } = require("../../helpers/responses");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");


class DeliveryOrderReceiveOutstandingService {
  static async getAll() {
    try {
      const data = await Delivery_Order_Receipt_Outstanding.findAll({
        include: [
          {
            model: Delivery_Order_Receipt,
          },
          {
            model: Master_User,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["id", "name"],
              },
            ],
            as: "creator",
          },
          {
            model: Master_User,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["id", "name"],
              },
            ],
            as: "approver",
          },
        ],
        order: [["createdAt", "DESC"]],
      })

      const result = data.map((item) => {
        return {
          id: item.id,
          code: item.code,
          deliveryOrderReceiptCode: item.Delivery_Order_Receipt.code,
          createdAt: item.createdAt,
          status: item.status,
          approvedAt: item.approvedAt,
          approvedBy: {
            id: item?.approver?.id,
            name: item?.approver?.name,
            roleName: item?.approver?.Master_Role?.name
          },
          createdBy: {
            id: item?.creator?.id,
            name: item?.creator?.name,
            roleName: item?.creator?.Master_Role?.name
          }
        }
      })

      return result
    } catch (error) {
      throw throwValidation(error.code, error.message);
    }
  }

  static async getOne(code) {
    try {
      const data = await Delivery_Order_Receipt_Outstanding.findOne({
        where: { code },
        attributes: ["id", "code", "status", "createdAt", "approvedAt", "approvedBy", "notes"],
        include: [
          {
            model: Master_User,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["id", "name"],
              },
            ],
            as: "creator",
          },
          {
            model: Master_User,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["id", "name"],
              },
            ],
            as: "approver",
          },
          {
            model: Delivery_Order_Receipt,
            attributes: ["id", "code"],
            include: [
              {
                model: Delivery_Order_Receipt_Product,
                separate: true,
              },
              {
                model: Delivery_Order,
                attributes: ["id", "code", "notes"],
                include: [
                  {
                    model: Master_Warehouse,
                    paranoid: false,
                    as: "warehouseOrigin",
                  },
                  {
                    model: Master_Warehouse,
                    as: "warehouseDestination",
                    paranoid: false,
                  },
                ],
              }
            ]
          },
          {
            model: Delivery_Order_Receipt_Outstanding_Product,
            as: "productOutstandings",
            separate: true,
            include: [
              {
                model: Delivery_Order_Product,
                attributes: ["id", "quantity",],
                include: [
                  {
                    model: Warehouse_Product,
                    paranoid: false,
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
                        as: "mwr"
                      },
                    ],
                  },
                ]
              },
            ]
          }
        ],
        order: [
          ["createdAt", "DESC"],
        ]
      })

      const result = {
        id: data.id,
        code: data.code,
        status: data.status,
        createdAt: data.createdAt,
        warehouseOrigin: {
          name: data?.Delivery_Order_Receipt?.Delivery_Order?.warehouseOrigin?.name,
          location: data?.Delivery_Order_Receipt?.Delivery_Order?.warehouseOrigin?.location
        },
        warehouseDestination: {
          name: data?.Delivery_Order_Receipt?.Delivery_Order?.warehouseDestination?.name,
          location: data?.Delivery_Order_Receipt?.Delivery_Order?.warehouseDestination?.dataValues?.loca
        },
        approvedAt: data?.approvedAt,
        approverBy: {
          id: data?.approver?.id,
          name: data?.approver?.name,
          roleName: data?.approver?.Master_Role?.name
        },
        creatorBy: {
          id: data?.creator?.id,
          name: data?.creator?.name,
          roleName: data?.creator?.Master_Role?.name
        },
        deliveryOrderReceiptCode: data?.Delivery_Order_Receipt?.code,
        deliveryOrderCode: data?.Delivery_Order_Receipt?.Delivery_Order?.code,
        productOutstandings: data?.productOutstandings?.map((item) => {
          const productRecived = data?.Delivery_Order_Receipt?.Delivery_Order_Receipt_Products
          const qtyRecived = productRecived?.find((product) => product?.deliveryOrderProductId === item?.deliveryOrderProductId)
          return {
            productOutstandingsId: item.id,
            quantityFrom: item?.Delivery_Order_Product?.quantity,
            quantityReceived: qtyRecived?.receiveQuantity,
            quantityOutstanding: item.outstandingQuantity,
            productName: item?.Delivery_Order_Product?.Warehouse_Product?.Master_Product?.name,
            unitName: item?.Delivery_Order_Product?.Warehouse_Product?.Master_Unit?.name,
            status: item?.status,
            rackName: item?.Delivery_Order_Product?.Warehouse_Product?.mwr?.name
          }
        }),
        notes: data?.notes
      }

      return result
    } catch (error) {
      throw throwValidation(error.code, error.message);
    }
  }

  static async saveToDraft({ code, data, notes }) {
    const transaction = await sq.transaction();
    try {
      if (data.length > 0) {
        for (const item of data) {
          const product = await Delivery_Order_Receipt_Outstanding_Product.findOne({
            where: {
              id: item.id
            },
            transaction
          })
          if (!product) {
            throw { code: 400, message: "Product not found" }
          }

          product.status = item.status
          await product.save({ transaction });
        }
      }

      if (notes) {
        const updateNotes = await Delivery_Order_Receipt_Outstanding.findOne({
          where: {
            code: code
          },
          transaction
        })

        updateNotes.notes = notes
        await updateNotes.save({ transaction });
      }

      await transaction.commit();
      return
    } catch (error) {
      await transaction.rollback();
      throw throwValidation(error.code, error.message);
    }
  }

  static async approve({ code, user, notes, products }) {
    const transaction = await sq.transaction();
    try {
      if (products.length > 0) {
        for (const item of products) {
          const product = await Delivery_Order_Receipt_Outstanding_Product.findOne({
            where: {
              id: item.id
            },
            transaction
          })
          if (!product) {
            throw { code: 400, message: "Product not found" }
          }
          product.status = item.status
          await product.save({ transaction });
        }
      }
      const updateNotes = await Delivery_Order_Receipt_Outstanding.findOne({
        where: {
          code: code
        },
        transaction
      })
      updateNotes.notes = notes
      await updateNotes.save({ transaction });

      const exsistingData = await Delivery_Order_Receipt_Outstanding.findOne({
        where: {
          code: code
        },
        include: [
          {
            model: Delivery_Order_Receipt,
            attributes: ["id", "code"],
            include: [
              {
                model: Delivery_Order_Receipt_Product,
              },
              {
                model: Delivery_Order,
                attributes: ["id", "code", "notes", "warehouseDestinationId"],
              }
            ]
          },
          {
            model: Delivery_Order_Receipt_Outstanding_Product,
            as: "productOutstandings",
            include: [
              {
                model: Delivery_Order_Product,
              }
            ]
          }
        ],
        transaction
      })

      switch (exsistingData?.status) {
        case "APPROVED":
          throw { code: 400, message: "Surat Outstanding sudah approve" }
        default:
          if (!exsistingData) {
            throw { code: 400, message: "Surat Outstanding tidak ditemukan" }
          }
      }

      const stockAjustmentHistory = []
      // CHECK PRODUK PLUS UPDATE QUANTITY
      const listProduct = exsistingData?.productOutstandings
      for (const item of listProduct) {
        if (item.status === 'solved') {
          const product = await Warehouse_Product.findOne({
            where: {
              id: item?.productWarehouseId
            },
            transaction
          })
          const quantityAfterAdd = product.quantity + item.outstandingQuantity
          product.quantity = quantityAfterAdd
          await product.save({ transaction });

          if (!product) {
            throw { code: 400, message: "Product not found" }
          }
          const warehouseDestination = exsistingData?.Delivery_Order_Receipt?.Delivery_Order
          stockAjustmentHistory.push({
            productWarehouseId: product.id,
            quantity: item.outstandingQuantity,
            adjustmentType: "PLUS",
            warehouseId: product.warehouseId,
            userId: user.id,
            info: "OUTSTANDING",
            deliveryOrderReceiptOutstandingId: exsistingData.id,
            lastQuantity: quantityAfterAdd
          })
        }
      }

      // UPDATE STATUS APPROVED
      exsistingData.status = "APPROVED"
      exsistingData.approvedBy = user.id
      exsistingData.approvedAt = new Date()
      await exsistingData.save({ transaction })

      await StockAdjustmentHistoryService.bulkCreate({ data: stockAjustmentHistory, transaction })

      transaction.commit();
      // transaction.rollback();
      return
    } catch (error) {
      transaction.rollback()
      throw throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderReceiveOutstandingService