const { Op } = require("sequelize");
const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");
const {
  sequelize: sq,
  Stock_Opname,
  Master_Warehouse,
  Master_User,
  Stock_Opname_Product,
  Warehouse_Product,
  Master_Product,
  Master_Unit,
  Master_Warehouse_Rack,
  Master_Company,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class StockOpnameService {

  static async findAll(query) {
    try {
      let { warehouseId } = query
      const data = await Stock_Opname.findAll({
        where: {
          ...(warehouseId ? { warehouseId } : {})
        },
        include: [
          { model: Master_Warehouse, paranoid: false },
          { model: Master_User, as: "creator" },
          { model: Master_User, as: "updater" },
          { model: Master_User, as: "deleter" }
        ],
        order: [["opnameDate", "DESC"]]
      });

      console.log(data);


      const result = data.map((item) => {
        return {
          id: item.id,
          code: item.code,
          status: item.status,
          warehouseId: item?.Master_Warehouse.id,
          warehouseName: item?.Master_Warehouse.name,
          opnameDate: formatDate(item?.opnameDate),
          creatorName: item?.creator?.name,
          updaterName: item?.updater?.name,
          deleterName: item?.deleter?.name,
          createdAt: item?.createdAt,
          updatedAt: item?.updatedAt,
          notes: item?.notes
        }
      })

      return result
    } catch (error) {
      console.log(error);

      throw error
    }
  }

  static async getDetailByCode(code) {
    try {
      const data = await Stock_Opname.findOne({
        where: {
          code
        },
        include: [
          {
            model: Master_Warehouse,
            paranoid: false
          },
          { model: Master_User, as: "creator" },
          { model: Master_User, as: "updater" },
          { model: Master_User, as: "deleter" },
          {
            model: Stock_Opname_Product,
            include: [
              {
                model: Warehouse_Product,
                include: [
                  {
                    model: Master_Product,
                    include: [
                      {
                        model: Master_Company,
                        attributes: ["name"]
                      }
                    ],
                  },
                  {
                    model: Master_Unit
                  },
                  Master_Warehouse_Rack,
                ]
              }
            ]
          }
        ],
      });

      if (!data) {
        throw {
          code: 404,
          message: "Stock Opname tidak ditemukan"
        }
      }

      const listDataProduct = data.Stock_Opname_Products.map((item) => {
        return {
          id: item?.id,
          productId: item?.Warehouse_Product?.Master_Product?.id,
          productWarehouseId: item?.Warehouse_Product?.id,
          productName: item?.Warehouse_Product?.Master_Product?.name,
          rackName: item?.Warehouse_Product?.Master_Warehouse_Rack?.dataValues?.n || null,
          unitId: item?.Warehouse_Product?.Master_Unit?.id,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          systemStock: item?.systemStock,
          actualStock: item?.actualStock,
          diff: item?.diff,
          isAdjustment: item.isAdjustment,
          companyName: item.Warehouse_Product.Master_Product.dataValues.Master_C
        }
      })

      const sortListProduct = listDataProduct.sort((a, b) => {
        return a.productName.localeCompare(b.productName)
      })

      const result = {
        id: data.id,
        code: data.code,
        status: data.status,
        warehouseId: data?.Master_Warehouse.id,
        warehouseName: data?.Master_Warehouse.name,
        opnameDate: formatDate(data?.opnameDate),
        creatorName: data?.creator?.name,
        updaterName: data?.updater?.name,
        deleterName: data?.deleter?.name,
        createdAt: formatDate(data?.createdAt),
        updatedAt: formatDate(data?.updatedAt),
        notes: data?.notes,
        listProduct: sortListProduct
      }

      return result
    } catch (error) {
      throw error
    }
  }

  static async create(data, user) {
    const transaction = await sq.transaction();
    try {
      const checkStockOpname = await Stock_Opname.findOne({
        where: {
          warehouseId: data.warehouseId,
          status: { [Op.notIn]: ["CLOSED", "REJECTED"] }
        }
      })

      if (checkStockOpname) throw { code: 400, message: "Stock Opname sudah ada, mohon selesaikan dahulu stock opname sebelumnya" }

      const code = await codeGenerator(8, "STO");
      const created = {
        code,
        warehouseId: data.warehouseId,
        status: data.status,
        opnameDate: data.opnameDate,
        createdBy: user?.id || null,
        notes: data?.notes || ""
      }
      if (data.status === "PENDING") {
        data.data.forEach((item) => {
          if (!item.actualStock) throw { code: 400, message: "Data belum lengkap" }
        })
      }
      const stockOpname = await Stock_Opname.create(created, { transaction });
      const createdWarehouseProduct = data.data.map((item) => {
        return {
          ...item,
          stockOpnameId: stockOpname.id
        }
      })
      const productStockOpname = await Stock_Opname_Product.bulkCreate(createdWarehouseProduct, { transaction });
      await transaction.commit();
      return stockOpname
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async update(code, data, user) {
    const transaction = await sq.transaction();
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code,
        }
      });

      if (!existingStockOpname) throw { code: 404, message: "Stock Opname tidak ditemukan" }

      if (data.status === "PENDING") {
        data.data.forEach((item) => {
          if (!item.actualStock) throw { code: 400, message: "Data harus lengkap" }
        })
        existingStockOpname.status = "PENDING"
      }

      existingStockOpname.notes = data?.notes
      existingStockOpname.updatedBy = user?.id
      await existingStockOpname.save({ transaction });
      for (const item of data?.data) {
        const existingWarehouseProduct = await Stock_Opname_Product.findOne({
          where: {
            id: item.id
          }
        });
        if (!existingWarehouseProduct) throw { code: 404, message: "Stock Opname Product tidak ditemukan" }
        existingWarehouseProduct.actualStock = item.actualStock
        existingWarehouseProduct.diff = item.diff
        await existingWarehouseProduct.save({ transaction });
      }
      await transaction.commit();
      return existingStockOpname
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async delete(code, user) {
    const transaction = await sq.transaction();
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code
        }
      });

      if (!existingStockOpname) throw { code: 404, message: "Stock Opname tidak ditemukan" }

      const updatedStockOpname = await Stock_Opname.update({ deletedBy: user?.id || 3 }, { where: { id } }, { transaction });

      await Stock_Opname.destroy({
        where: {
          code
        },
        transaction
      });


      await transaction.commit();
      return updatedStockOpname
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async approve(code, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code
        },
        include: [
          {
            model: Stock_Opname_Product
          }
        ]
      });


      switch (existingStockOpname.status) {
        case "APPROVED":
          throw { code: 400, message: "Stock Opname sudah di approve" };
        case "REJECTED":
          throw { code: 400, message: "Stock Opname sudah di reject" };
        // case "DRAFT":
        //   throw { code: 400, message: "Stock Opname masih tahap draft" };
        default:
          if (!existingStockOpname) {
            throw { code: 404, message: "Stock Opname tidak ditemukan" };
          }
      }

      // CHECK DATA ACTUAL STOCK BEFORE APPROVE FROM DRAFT BEFORE IMPLEMENT PENDING
      // IF ALREADY IMPLEMENTED PENDING STATUS, CODE WILL BE DEPRECATED
      if (existingStockOpname.status === "DRAFT") {
        existingStockOpname.Stock_Opname_Products.forEach((item) => {
          if (item.actualStock === null) throw { code: 400, message: "Data belum lengkap" }
        })
      }
      // ======================================================================

      const updatedStockOpname = await Stock_Opname.update({ status: "APPROVED", updatedBy: user?.id }, { where: { code } });

      return updatedStockOpname
    } catch (error) {
      throw error
    }
  }

  static async reject(code, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code
        }
      });

      switch (existingStockOpname.status) {
        case "APPROVED":
          throw { code: 400, message: "Stock Opname sudah di approve" };
        case "REJECTED":
          throw { code: 400, message: "Stock Opname sudah di reject" };
        default:
          if (!existingStockOpname) {
            throw { code: 404, message: "Stock Opname tidak ditemukan" };
          }
      }

      const updatedStockOpname = await Stock_Opname.update({ status: "REJECTED", updatedBy: user?.id }, { where: { code } });
      return updatedStockOpname
    } catch (error) {
      throw error
    }
  }

  static async pending(code, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code
        }
      });

      switch (existingStockOpname.status) {
        case "APPROVED":
          throw { code: 400, message: "Stock Opname sudah di approve" };
        case "REJECTED":
          throw { code: 400, message: "Stock Opname sudah di reject" };
        // case "DRAFT":
        //   throw { code: 400, message: "Stock Opname masih tahap draft" };
        default:
          if (!existingStockOpname) {
            throw { code: 404, message: "Stock Opname tidak ditemukan" };
          }
      }

      const updatedStockOpname = await Stock_Opname.update({ status: "PENDING", updatedBy: user?.id }, { where: { id } });
      return updatedStockOpname
    } catch (error) {
      throw error
    }
  }

  static async confirm({ code, data, user }) {
    const transaction = await sq.transaction();
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          code
        }
      });

      switch (existingStockOpname.status) {
        case "CLOSED":
          throw { code: 400, message: "Stock Opname sudah selesai" };
        case "DRAFT":
          throw { code: 400, message: "Stock Opname masih tahap draft" };
        default:
          if (!existingStockOpname) {
            throw { code: 404, message: "Stock Opname tidak ditemukan" };
          }
      }

      // CHECK DATA ACTUAL STOCK BEFORE APPROVE FROM DRAFT BEFORE IMPLEMENT
      const createdHistory = []
      if (data?.length > 0) {
        for (const item of data) {
          // UPDATE STATUS STOCK OPNAME PRODUCT
          const stockOpnameProduct = await Stock_Opname_Product.findOne({
            where: {
              id: item
            },
            transaction
          })

          // CHECK MINUS OR PLUS
          const type = stockOpnameProduct.actualStock - stockOpnameProduct.systemStock;
          const result = type < 0 ? 'MINUS' : 'PLUS';

          // Skip the rest of the operations if actual stock - system stock is 0
          if (type === 0) {
            continue;
          }

          stockOpnameProduct.isAdjustment = true
          await stockOpnameProduct.save({ transaction })

          // UPDATE QUANTITY BASED ON STOCK OPNAME PRODUCT
          const warehouseProduct = await Warehouse_Product.findOne({
            where: {
              id: stockOpnameProduct.warehouseProductId
            },
            transaction
          })

          warehouseProduct.quantity = stockOpnameProduct.actualStock
          await warehouseProduct.save({ transaction })

          // CREATE HISTORY
          createdHistory.push({
            productWarehouseId: warehouseProduct.id, // AMBIL DARI WAREHOUSE PRODUCT
            quantity: stockOpnameProduct.diff, // AMBIL DARI STOCK OPNAME
            warehouseId: warehouseProduct.warehouseId, // AMBIL DARI WAREHOUSE PRODUCT
            adjustmentType: result, // AMBIL DARI STOCK OPNAME HASIL PENGURANGAN SYSTEM STOCK DENGAN ACTUAL STOCK
            info: "STOCK OPNAME",
            userId: user?.id, // AMBIL DARI USER YANG APPROVE
            description: JSON.stringify({
              stockBefore: stockOpnameProduct.systemStock,
              stockAfter: stockOpnameProduct.actualStock
            }),
            lastQuantity: warehouseProduct.quantity, // AMBIL DARI WAREHOUSE PRODUCT YANG SUDAH DIUPDATE
            stockOpnameId: existingStockOpname.id, // AMBIL DARI STOCK OPNAME
          })
        }
      }

      // CREATE HISTORY
      await StockAdjustmentHistoryService.bulkCreate({ data: createdHistory, transaction })

      // UPDATE STATUS STOCK OPNAME
      await Stock_Opname.update({ status: "CLOSED", updatedBy: user?.id }, { where: { code }, transaction })

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async checkStockOpnameWarehouse(id) {
    try {
      const data = await Master_Warehouse.findOne({
        where: {
          id,
        },
        include: [
          {
            model: Stock_Opname,
            where: {
              status: ["APPROVED", "PENDING", "DRAFT"],
            },
            required: false,
          },
        ],
      });

      if (!data) {
        throw { code: 404, message: "Warehouse tidak ditemukan" };
      }

      const result = {
        id: data.id,
        name: data.name,
        isHaveStockOpname: data?.Stock_Opnames.length > 0 ? true : false,
        message: `Sudah ada stock opname dengan code: ${data?.Stock_Opnames[0]?.code} dan status ${data?.Stock_Opnames[0]?.status}. Mohon di selesaikan dahulu`,
        stockOpnameCode: data?.Stock_Opnames[0]?.code,
        stockOpnameStatus: data?.Stock_Opnames[0]?.status,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockOpnameService