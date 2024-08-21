const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");

const {
  sequelize: sq,
  Master_Product,
  Master_Category,
  Master_Unit,
  Master_User,
  Master_Warehouse,
  Master_Role,
  Warehouse_Product,
  Delivery_Order,
  Delivery_Order_Product,
  Adjustment_Goods_Out,
  Adjustment_Goods_Out_Product,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");


class GoodsOutService {

  static async getAll({ user }) {
    try {

      const goodsOut = await Adjustment_Goods_Out.findAll({
        where: {
          ...(user?.warehouseId ? { warehouseOriginId: user.warehouseId } : {})
        },
        include: [
          {
            model: Master_Warehouse
          },
          {
            model: Master_User,
            as: "creator",
            include: [
              {
                model: Master_Role
              }
            ]
          },
          {
            model: Master_User,
            as: "approver"
          },
          {
            model: Master_User,
            as: "deleter"
          }
        ],
        order: [["createdAt", "DESC"]]
      })

      const sendData = goodsOut.map((item) => {
        return {
          id: item.id,
          code: item.code,
          warehouseOriginId: item?.warehouseOriginId,
          warehouseOriginName: item?.Master_Warehouse?.name,
          notes: item?.notes,
          status: item?.status,
          createdBy: {
            name: item?.creator?.name,
            roleName: item?.creator?.Master_Role?.name
          },
          createdAt: item?.createdAt,
          dateCreated: formatDate(item?.createdAt),
          approverBy: item?.approver?.name,
          approvedAt: item?.approvedAt,
          dateApproved: formatDate(item?.approvedAt),
        }
      })

      return sendData
    } catch (error) {
      throw error
    }
  }

  static async create({ data, user }) {
    const transaction = await sq.transaction();
    try {
      const generateCode = await codeGenerator(8, "GDO");

      const createdData = await Adjustment_Goods_Out.create({
        code: generateCode,
        warehouseOriginId: data.warehouseOrigin,
        notes: data?.notes || "",
        status: "PENDING",
        createdBy: user?.id,
      }, { transaction });

      const createdProduct = data?.listProduct?.map((item) => {
        return {
          ...item,
          adjustmentGoodsOutId: createdData.id,
          createdBy: user?.id,
          quantity: item?.qty
        }
      })

      await Adjustment_Goods_Out_Product.bulkCreate(createdProduct, { transaction });

      await transaction.commit();
      return createdData
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async approve({ code, user }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Adjustment_Goods_Out.findOne({
        where: {
          code: code
        }
      })

      // CHECKING STATUS
      switch (exsistingData?.status) {
        case "APPROVED":
          throw { code: 400, message: "Data sudah di approve" };
        case "REJECTED":
          throw { code: 400, message: "Data sudah di reject" };
        default:
          if (!exsistingData) {
            throw { code: 400, message: "Data tidak ditemukan" };
          }
      }

      // CHECK STOCK BEFORE APPROVE
      const goodsOutProduct = await Adjustment_Goods_Out_Product.findAll({
        where: {
          adjustmentGoodsOutId: exsistingData?.id
        }
      })

      for (const item of goodsOutProduct) {
        const warehouseProduct = await Warehouse_Product.findOne({
          where: {
            id: item.warehouseProductId,
          }
        })
        if (warehouseProduct?.quantity < item?.quantity) {
          throw { code: 400, message: "Stock  tidak mencukupi" };
        }
      }
      // DONE CHECKING STOCK BEFORE APPROVE

      // MINUS STOCK AT WAREHOUSE PRODUCT
      const stockAjustmentHistory = []
      for (const item of goodsOutProduct) {
        const warehouseProduct = await Warehouse_Product.findOne({
          where: {
            id: item.warehouseProductId,
          },
          transaction: transaction
        });
        await Warehouse_Product.update({
          quantity: warehouseProduct?.quantity - item?.quantity
        }, {
          where: {
            id: item.warehouseProductId
          },
          transaction: transaction
        });
        stockAjustmentHistory.push({
          productWarehouseId: item.warehouseProductId,
          quantity: item.quantity,
          adjustmentType: "MINUS",
          warehouseId: exsistingData.warehouseOriginId,
          userId: user.id,
          info: "GOODS OUT",
          adjustmentGoodsOutId: exsistingData.id,
          lastQuantity: warehouseProduct?.quantity - item?.quantity
        })
      }
      // DONE MINUS STOCK AT WAREHOUSE PRODUCT

      // CREATE HISTORY
      await StockAdjustmentHistoryService.bulkCreate({
        data: stockAjustmentHistory,
        transaction: transaction,
      });

      // APPROVE DATA
      const approvedData = await Adjustment_Goods_Out.update({
        status: "APPROVED",
        approvedBy: user?.id,
        approvedAt: new Date(),
      }, {
        where: {
          code: code
        },
        transaction: transaction
      });

      await transaction.commit()
      return approvedData
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async reject({ code, user }) {
    try {
      const exsistingData = await Adjustment_Goods_Out.findOne({
        where: {
          code: code
        }
      })

      switch (exsistingData?.status) {
        case "APPROVED":
          throw { code: 400, message: "Data sudah di approve" };
        case "REJECTED":
          throw { code: 400, message: "Data sudah di reject" };
        default:
          if (!exsistingData) {
            throw { code: 400, message: "Data tidak ditemukan" };
          }
      }

      const rejectedData = await Adjustment_Goods_Out.update({
        status: "REJECTED",
        approvedBy: user?.id,
        approvedAt: new Date(),
      }, {
        where: {
          code: code
        }
      })

      return rejectedData
    } catch (error) {
      throw error
    }
  }

  static async getDetailByCode(code) {
    try {
      const goodsOut = await Adjustment_Goods_Out.findOne({
        where: {
          code: code
        },
        include: [
          {
            model: Adjustment_Goods_Out_Product,
            as: "agop",
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product
                  },
                  {
                    model: Master_Unit
                  }
                ]
              },
            ]
          },
          {
            model: Master_Warehouse
          },
          {
            model: Master_User,
            as: "creator"
          },
          {
            model: Master_User,
            as: "approver"
          },
          {
            model: Master_User,
            as: "deleter"
          }
        ]
      })

      const listProduct = goodsOut.agop.map((item) => {
        return {
          id: item.id,
          warehouseProductId: item?.warehouseProductId,
          quantity: item?.quantity,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          productName: item?.Warehouse_Product?.Master_Product?.name
        }
      })

      const sendData = {
        id: goodsOut.id,
        status: goodsOut?.status,
        notes: goodsOut?.notes,
        code: goodsOut.code,
        receivedAt: goodsOut?.receivedAt,
        warehouseOriginId: goodsOut?.warehouseOriginId,
        warehouseOriginName: goodsOut?.Master_Warehouse?.name,
        warehouseLocation: goodsOut?.Master_Warehouse?.location,
        createdBy: goodsOut?.creator?.name,
        approvedBy: goodsOut?.approver?.name,
        deletedBy: goodsOut?.deleter?.name,
        approvedAt: goodsOut?.approvedAt,
        createdAt: goodsOut?.createdAt,
        updatedAt: goodsOut?.updatedAt,
        listProduct: listProduct,
      }

      return sendData
    } catch (error) {
      throw error
    }
  }

}

module.exports = GoodsOutService