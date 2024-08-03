const { generateDeliveryOrderId } = require("../../helpers/deliveryOrderIdGenerator");
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
} = require("../../models")

class StockOpnameService {

  static async findAll(query) {
    try {
      let { warehouseId } = query
      const data = await Stock_Opname.findAll({
        where: {
          ...(warehouseId ? { warehouseId } : {})
        },
        include: [
          { model: Master_Warehouse },
          { model: Master_User, as: "creator" },
          { model: Master_User, as: "updater" },
          { model: Master_User, as: "deleter" }
        ],
        order: [["createdAt", "DESC"]]
      });

      const result = data.map((item) => {
        return {
          id: item.id,
          code: item.code,
          status: item.status,
          warehouseId: item?.Master_Warehouse.id,
          warehouseName: item?.Master_Warehouse.name,
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
      throw error
    }
  }

  static async getDetailById(id) {
    try {
      const data = await Stock_Opname.findOne({
        where: {
          id
        },
        include: [
          {
            model: Master_Warehouse,
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
                    model: Master_Product
                  },
                  {
                    model: Master_Unit
                  },
                  Master_Warehouse_Rack
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
          rackName: item.Warehouse_Product.Master_Warehouse_Rack.dataValues?.n || null,
          unitId: item?.Warehouse_Product?.Master_Unit?.id,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          systemStock: item?.systemStock,
          actualStock: item?.actualStock,
          diff: item?.diff
        }
      })



      const result = {
        id: data.id,
        code: data.code,
        status: data.status,
        warehouseId: data?.Master_Warehouse.id,
        warehouseName: data?.Master_Warehouse.name,
        creatorName: data?.creator?.name,
        updaterName: data?.updater?.name,
        deleterName: data?.deleter?.name,
        createdAt: formatDate(data?.createdAt),
        updatedAt: formatDate(data?.updatedAt),
        notes: data?.notes,
        listProduct: listDataProduct
      }

      return result
    } catch (error) {
      throw error
    }
  }

  static async create(data, user) {
    const transaction = await sq.transaction();
    try {
      const code = await generateDeliveryOrderId(8, "STO");
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

  static async update(id, data, user) {
    const transaction = await sq.transaction();
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          id: id
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

  static async delete(id, user) {
    const transaction = await sq.transaction();
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          id
        }
      });

      if (!existingStockOpname) throw { code: 404, message: "Stock Opname tidak ditemukan" }

      const updatedStockOpname = await Stock_Opname.update({ deletedBy: user?.id || 3 }, { where: { id } }, { transaction });

      await Stock_Opname.destroy({
        where: {
          id
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

  static async approve(id, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          id
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
          if (!item.actualStock) throw { code: 400, message: "Data belum lengkap" }
        })
      }
      // ======================================================================

      const updatedStockOpname = await Stock_Opname.update({ status: "APPROVED", updatedBy: user?.id }, { where: { id } });

      return updatedStockOpname
    } catch (error) {
      throw error
    }
  }

  static async reject(id, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          id
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

      const updatedStockOpname = await Stock_Opname.update({ status: "REJECTED", updatedBy: user?.id }, { where: { id } });
      return updatedStockOpname
    } catch (error) {
      throw error
    }
  }

  static async pending(id, user) {
    try {
      const existingStockOpname = await Stock_Opname.findOne({
        where: {
          id
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


}

module.exports = StockOpnameService