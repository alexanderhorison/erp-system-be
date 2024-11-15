const { codeGenerator } = require("../../helpers/codeGenerator");
const { formatDate } = require("../../helpers/formatDate");
const {
  sequelize: sq,
  Master_Product,
  Master_Unit,
  Master_User,
  Master_Company,
  Master_Warehouse,
  Master_Role,
  Warehouse_Product,
  Master_Warehouse_Rack,
  Internal_Transfer,
  Internal_Transfer_Product,
} = require("../../models");

class InternalTransferService {
  static async getAll({ user }) {
    try {
      const allData = await Internal_Transfer.findAll({
        where: {
          ...(user?.warehouseId ? { warehouseId: user.warehouseId } : {}),
        },
        include: [
          {
            model: Master_Warehouse,
            paranoid: false,
            attributes: ["name"],
          },
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_User,
            as: "approver",
            attributes: ["name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const sendData = allData.map((item) => {
        return {
          id: item.id,
          code: item.code,
          warehouseOriginId: item?.warehouseId,
          warehouseOriginName: item?.Master_Warehouse?.name,
          notes: item?.notes,
          status: item?.status,
          createdBy: {
            name: item?.creator?.name,
            roleName: item?.creator?.Master_Role?.name,
          },
          createdAt: item?.createdAt,
          dateCreated: formatDate(item?.createdAt),
          approverBy: item?.approver?.name,
          approvedAt: item?.approvedAt,
          dateApproved: formatDate(item?.approvedAt),
        };
      });

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async create({ data, user }) {
    const transaction = await sq.transaction();
    try {
      const generateCode = await codeGenerator(8, "IT");

      const createdData = await Internal_Transfer.create(
        {
          code: generateCode,
          warehouseId: data.warehouseId,
          notes: data?.notes || "",
          status: "PENDING",
          createdBy: user?.id,
        },
        { transaction }
      );

      const createInternalTransferProducts = [];
      const listProduct = data?.listProduct;

      for (const item of listProduct) {
        // check racks is exist
        const rackFrom = await Master_Warehouse_Rack.findByPk(
          item.warehouseRackFromId
        );
        const rackTo = await Master_Warehouse_Rack.findByPk(
          item.warehouseRackToId
        );
        if (!rackFrom || !rackTo) {
          throw { code: 400, message: "Salah satu rack tidak ditemukan" };
        }

        const findWarehouseProduct = await Warehouse_Product.findByPk(
          item.warehouseProductId
        );

        if (!findWarehouseProduct) {
          throw {
            code: 400,
            message: "Salah satu product warehouse tidak ditemukan",
          };
        }

        // IF FOUND, GET WAREHOUSE PRODUCT ID
        createInternalTransferProducts.push({
          internalTransferId: createdData.id,
          warehouseProductId: item.warehouseProductId,
          warehouseRackFromId: item.warehouseRackFromId,
          warehouseRackToId: item.warehouseRackToId,
        });
      }

      await Internal_Transfer_Product.bulkCreate(
        createInternalTransferProducts,
        {
          transaction,
        }
      );

      await transaction.commit();
      return createdData;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async approve({ code, user }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Internal_Transfer.findOne({
        where: {
          code: code,
        },
      });

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

      // FIND PRODUCT INTERNAL TRANSFER
      const internalTransferProducts = await Internal_Transfer_Product.findAll({
        where: {
          internalTransferId: exsistingData?.id,
        },
      });

      for (const item of internalTransferProducts) {
        const warehouseProduct = await Warehouse_Product.findByPk(
          item.warehouseProductId
        );

        if (!warehouseProduct) {
          throw { code: 400, message: "Produk tidak ditemukan" };
        }

        // UPDATE RACK TO NEW RACK
        await warehouseProduct.update(
          {
            warehouseRackId: item.warehouseRackToId,
          },
          { transaction }
        );
      }

      // CHANGE STATUS INTERNAL TRANSFER
      const approvedData = await Internal_Transfer.update(
        {
          status: "APPROVED",
          approvedBy: user?.id,
          approvedAt: new Date(),
        },
        {
          where: {
            code: code,
          },
          transaction,
        }
      );

      await transaction.commit();
      return approvedData;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async reject({ code, user }) {
    try {
      const exsistingData = await Internal_Transfer.findOne({
        where: {
          code: code,
        },
      });

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

      const rejectedData = await Internal_Transfer.update(
        {
          status: "REJECTED",
          approvedBy: user?.id,
          approvedAt: new Date(),
        },
        {
          where: {
            code: code,
          },
        }
      );

      return rejectedData;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailByCode(code) {
    try {
      const detail = await Internal_Transfer.findOne({
        where: { code: code },
        include: [
          {
            model: Master_Warehouse,
            attributes: ["id", "name", "location"],
            paranoid: false,
          },
          { model: Master_User, as: "creator", attributes: ["id", "name"] },
          { model: Master_User, as: "approver", attributes: ["id", "name"] },
        ],
      });

      if (!detail) {
        throw { code: 400, message: "Data tidak ditemukan" };
      }

      const internalTransferProducts = await Internal_Transfer_Product.findAll({
        where: { internalTransferId: detail.id },
        include: [
          {
            model: Warehouse_Product,
            paranoid: false,
            include: [
              {
                model: Master_Product,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Master_Company,
                    attributes: ["id", "name"],
                  },
                ],
              },
              { model: Master_Unit, attributes: ["id", "name"] },
            ],
          },
          {
            model: Master_Warehouse_Rack,
            as: "warehouseRackOrigin",
            attributes: ["id", "name"],
          },
          {
            model: Master_Warehouse_Rack,
            as: "warehouseRackDestination",
            attributes: ["id", "name"],
          },
        ],
      });

      const listProduct = internalTransferProducts.map((item) => {
        return {
          id: item.id,
          warehouseProductId: item?.warehouseProductId,
          unitName: item?.Warehouse_Product?.Master_Unit?.name,
          productName: item?.Warehouse_Product?.Master_Product?.name,
          companyName:
            item?.Warehouse_Product?.Master_Product?.Master_Company?.name,
          warehouseRackFromId: item?.warehouseRackFromId,
          warehouseRackFrom: item?.warehouseRackOrigin?.name,
          warehouseRackToId: item?.warehouseRackToId,
          warehouseRackTo: item?.warehouseRackDestination?.name,
        };
      });

      const sendData = {
        id: detail.id,
        status: detail?.status,
        notes: detail?.notes,
        code: detail.code,
        warehouseId: detail?.warehouseId,
        warehouseName: detail?.Master_Warehouse?.name,
        warehouseLocation: detail?.Master_Warehouse?.location,
        createdBy: detail?.creator?.name,
        approvedBy: detail?.approver?.name,
        approvedAt: detail?.approvedAt,
        createdAt: detail?.createdAt,
        updatedAt: detail?.updatedAt,
        listProduct: listProduct,
      };

      return sendData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = InternalTransferService;
