

const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");

const {
  sequelize: sq,
  Master_Product,
  Master_Unit,
  Master_User,
  Master_Warehouse,
  Master_Role,
  Warehouse_Product,
  Adjustment_Goods_In,
  Adjustment_Goods_In_Product,
  Master_Warehouse_Rack,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");


class GoodsInService {

  static async getAll({ user }) {
    try {

      const goodsIn = await Adjustment_Goods_In.findAll({
        where: {
          ...(user?.warehouseId ? { warehouseDestinationId: user.warehouseId } : {})
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

      const sendData = goodsIn.map((item) => {
        return {
          id: item.id,
          code: item.code,
          warehouseDestinationId: item?.warehouseDestinationId,
          warehouseDestinationName: item?.Master_Warehouse?.name,
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
      const generateCode = await codeGenerator(8, "GDI");

      const createdData = await Adjustment_Goods_In.create({
        code: generateCode,
        warehouseDestinationId: data.warehouseDestination,
        notes: data?.notes || "",
        status: "PENDING",
        createdBy: user?.id,
      }, { transaction });

      const defaultRackId = await Master_Warehouse_Rack.findOne({
        where: {
          warehouseId: data.warehouseDestination,
          name: "default"
        },
        attributes: ["id"],
      })

      const createAdjustmentGoodsInProduct = []
      const createHistoryAdjusment = []
      // CHECKING IF PRODUCT EXIST IN WAREHOUSE PRODUCT ? CREATE : GET WAREHOUSE ID
      const listProduct = data?.listProduct
      for (const item of listProduct) {
        let warehouseProduct = await Warehouse_Product.findOne({
          where: {
            productId: item.masterProductId,
            unitId: item.unitId,
            warehouseId: data.warehouseDestination
          },
          attributes: ["id"],
        })
        // IF NOT FOUND, CREATE
        if (!warehouseProduct) {
          const createdId = await Warehouse_Product.create({
            productId: item.masterProductId,
            unitId: item.unitId,
            warehouseId: data.warehouseDestination,
            quantity: 0,
            minimumStock: 1,
            warehouseRackId: defaultRackId?.id
          }, { transaction })
          warehouseProduct = createdId
          // CREATE HISTORY
          createHistoryAdjusment.push({
            productWarehouseId: createdId.id,
            quantity: 0,
            adjustmentType: "INITIATE",
            warehouseId: data.warehouseDestination,
            userId: user.id,
            info: "GOODS IN",
            adjustmentGoodsInId: createdData.id,
          })
        }
        // IF FOUND, GET WAREHOUSE PRODUCT ID
        createAdjustmentGoodsInProduct.push({
          adjustmentGoodsInId: createdData.id,
          createdBy: user?.id,
          quantity: item?.quantity,
          warehouseProductId: warehouseProduct?.id
        })
      }

      await Adjustment_Goods_In_Product.bulkCreate(createAdjustmentGoodsInProduct, { transaction });

      await StockAdjustmentHistoryService.bulkCreate({ data: createHistoryAdjusment, transaction: transaction });

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
      const exsistingData = await Adjustment_Goods_In.findOne({
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

      // ADDING STOCK BEFORE APPROVE
      const goodsInProduct = await Adjustment_Goods_In_Product.findAll({
        where: {
          adjustmentGoodsInId: exsistingData?.id
        }
      })

      const stockAjustmentHistory = []
      for (const item of goodsInProduct) {
        const warehouseProduct = await Warehouse_Product.findOne({
          where: {
            id: item.warehouseProductId,
          }
        })
        if (!warehouseProduct) {
          throw { code: 400, message: "Produk tidak ditemukan" };
        }
        warehouseProduct.quantity += item.quantity
        await warehouseProduct.save({ transaction: transaction })
        stockAjustmentHistory.push({
          productWarehouseId: item.warehouseProductId,
          quantity: item.quantity,
          adjustmentType: "PLUS",
          warehouseId: exsistingData.warehouseDestinationId,
          userId: user.id,
          info: "GOODS IN",
          adjustmentGoodsInId: exsistingData.id,
        })
      }
      // DONE ADDING STOCK BEFORE APPROVE

      // CREATE HISTORY
      await StockAdjustmentHistoryService.bulkCreate({
        data: stockAjustmentHistory,
        transaction: transaction,
      });

      // APPROVE DATA
      const approvedData = await Adjustment_Goods_In.update({
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
      const exsistingData = await Adjustment_Goods_In.findOne({
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

      const rejectedData = await Adjustment_Goods_In.update({
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
      const goodsIn = await Adjustment_Goods_In.findOne({
        where: {
          code: code
        },
        include: [
          {
            model: Adjustment_Goods_In_Product,
            as: "agip",
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

      const listProduct = goodsIn.agip.map((item) => {
        return {
          id: item.id,
          warehouseProductId: item?.warehouseProductId,
          quantity: item?.quantity,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          productName: item?.Warehouse_Product?.Master_Product?.name
        }
      })

      const sendData = {
        id: goodsIn.id,
        status: goodsIn?.status,
        notes: goodsIn?.notes,
        code: goodsIn.code,
        receivedAt: goodsIn?.receivedAt,
        warehouseDestinationId: goodsIn?.warehouseDestinationId,
        warehouseDestinationName: goodsIn?.Master_Warehouse?.name,
        warehouseLocation: goodsIn?.Master_Warehouse?.location,
        createdBy: goodsIn?.creator?.name,
        approvedBy: goodsIn?.approver?.name,
        deletedBy: goodsIn?.deleter?.name,
        approvedAt: goodsIn?.approvedAt,
        createdAt: goodsIn?.createdAt,
        updatedAt: goodsIn?.updatedAt,
        listProduct: listProduct,
      }

      return sendData
    } catch (error) {
      throw error
    }
  }

}

module.exports = GoodsInService