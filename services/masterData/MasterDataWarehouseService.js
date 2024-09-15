const { throwValidation } = require("../../helpers/responses");
const {
  Master_Warehouse,
  Master_User,
  Master_Warehouse_Rack,
  Master_Warehouse_Rack_Attribute,
  sequelize: sq,
} = require("../../models");
const { Op } = require("sequelize");

class MasterDataWarehouseService {
  static async create(data, user) {
    const { name, description, location } = data;

    const existingWarehouse = await Master_Warehouse.findOne({
      where: { name: name },
    });

    if (existingWarehouse) {
      throw {
        code: 400,
        message: "Nama gudang sudah ada dalam database",
      };
    }

    const newWarehouse = await Master_Warehouse.create({
      name: name,
      description: description,
      location: location,
    });

    // Create default rack
    await Master_Warehouse_Rack.create({
      name: "default",
      description: "default rak",
      warehouseId: newWarehouse.id,
    });

    return newWarehouse;
  }

  static async update(id, data, user) {
    try {
      const { name, description, location, status } = data;

      const existingWarehouse = await Master_Warehouse.findOne({
        where: { id },
        paranoid: false
      });

      if (!existingWarehouse) {
        throw {
          code: 404,
          message: "Gudang tidak ditemukan",
        };
      }

      const updatedWarehouse = await existingWarehouse.update({
        name: name,
        description: description,
        location: location,
      });
      // RESTORE WHEN ACTIVE AGAIN
      if (status === "active") {
        await existingWarehouse.restore()
      }
      // DESTROY WHEN NOT ACTIVE
      if (status === "not-active") {
        await existingWarehouse.destroy()
      }

      return updatedWarehouse;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const warehouse = await Master_Warehouse.findByPk(id);

      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: "Gudang tidak ditemukan",
        });
      }

      // find user that have warehouse
      const existWarehouse = await Master_User.findOne({
        where: { warehouseId: id },
      });

      if (existWarehouse) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus gudang, karna ada user yang memiliki gudang ini",
        };
      }

      const deleteWarehouse = await Master_Warehouse.destroy({
        where: { id: id },
      });

      return deleteWarehouse;
    } catch (error) {
      throw error;
    }
  }

  static async findAll({ query }) {
    try {
      const data = await Master_Warehouse.findAll({
        ...(query?.status === "all" ? { paranoid: false } : {}),
        ...(query?.status === "active" ? { paranoid: true } : {}),
        ...(query?.status === "not-active" ? { where: { deletedAt: { [Op.not]: null } }, paranoid: false } : {}),
        order: [['deletedAt', 'DESC']],
      });

      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        status: item.deletedAt ? "not active" : "active",
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const warehouse = await Master_Warehouse.findOne({
        where: { id },
        paranoid: false
      });

      if (!warehouse) {
        throw {
          code: 404,
          message: "Gudang tidak ditemukan",
        };
      }

      const result = {
        id: warehouse.id,
        name: warehouse.name,
        location: warehouse.location,
        status: warehouse.deletedAt ? "not-active" : "active",
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async createWarehouseRack(body) {
    const transaction = await sq.transaction();
    try {
      const { warehouseId, description, name, data } = body;

      const existingWarehouseRack = await Master_Warehouse_Rack.findOne({
        where: {
          name: {
            [Op.iLike]: name,
          },
        },
      });

      if (existingWarehouseRack) {
        throwValidation(400, "Nama rak sudah ada dalam database");
      }

      // Create rack
      const createdRack = await Master_Warehouse_Rack.create(
        {
          name: name,
          description: description,
          warehouseId: warehouseId,
        },
        { transaction }
      );

      const dataRackAttr = [];

      data.forEach((item) => {
        // karna rak atribut optional 
        if (item.key && item.vaue) {
          dataRackAttr.push({
            key: item.key,
            value: item.value,
            warehouseRackId: createdRack.id,
          });
        }
      });

      // Bulk Create rack attributes
      await Master_Warehouse_Rack_Attribute.bulkCreate(dataRackAttr, {
        transaction,
      });

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateWarehouseRack(warehouseRackId, body) {
    const transaction = await sq.transaction();
    try {
      const { description, name, data } = body;

      const existingWarehouseRack = await Master_Warehouse_Rack.findByPk(
        warehouseRackId
      );

      if (!existingWarehouseRack) {
        throwValidation(404, "Rak tidak ditemukan");
      }

      // default rak tak boleh diedit
      if (
        existingWarehouseRack.name === "default" &&
        name !== existingWarehouseRack.name
      ) {
        throwValidation(400, "nama default rak tidak boleh diganti");
      }

      let findAllWarehouseRack = await Master_Warehouse_Rack_Attribute.findAll({
        where: { warehouseRackId: warehouseRackId },
        attributes: ["id"],
      });

      const updatedIds = [];

      // Update Rack Attribute
      for (const item of data) {
        // if there is id it will be update
        if (item.id) {
          const existingAttribute =
            await Master_Warehouse_Rack_Attribute.findOne({
              where: {
                id: item.id,
              },
              transaction,
            });

          if (!existingAttribute) {
            throwValidation(404, "Rak Attribute tidak ditemukan");
          }

          // Update the existing attribute
          await existingAttribute.update(
            { value: item.value, key: item.key },
            { transaction }
          );

          // to record the updated attribute id
          updatedIds.push(item.id);
        } else if (!item.id && item.value && item.key) {
          await Master_Warehouse_Rack_Attribute.create(
            {
              value: item.value,
              key: item.key,
              warehouseRackId: warehouseRackId,
            },
            { transaction }
          );
        }
      }

      // Update Rack
      await existingWarehouseRack.update(
        {
          name: name,
          description: description,
        },
        { transaction }
      );

      findAllWarehouseRack = findAllWarehouseRack.map((item) => {
        return item.id;
      });

      const idsToDelete = findAllWarehouseRack.filter(
        (item) => !updatedIds.includes(item)
      );

      if (idsToDelete.length > 0) {
        await Master_Warehouse_Rack_Attribute.destroy({
          where: {
            id: idsToDelete,
          },
          transaction,
        });
      }

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async findAllWarehouseRack(warehouseId) {
    try {
      const data = await Master_Warehouse_Rack.findAll({
        attributes: ["id", "name", "description", "warehouseId"],
        include: [
          {
            model: Master_Warehouse_Rack_Attribute,
            attributes: ["id", "warehouseRackId", "key", "value"],
          },
        ],
        where: { warehouseId: warehouseId },
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailWarehouseRack(id) {
    try {
      const warehouseRack = await Master_Warehouse_Rack.findByPk(id, {
        include: [
          {
            model: Master_Warehouse_Rack_Attribute,
          },
        ],
      });

      if (!warehouseRack) {
        throwValidation(404, "Warehouse rak tidak ditemukan");
      }

      const warehouseAttribute =
        warehouseRack.Master_Warehouse_Rack_Attributes.map((item) => {
          return {
            id: item.id,
            key: item.key,
            value: item.value,
          };
        });

      const result = {
        id: warehouseRack.id,
        name: warehouseRack.name,
        description: warehouseRack.description,
        warehouseId: warehouseRack.warehouseId,
        data: warehouseAttribute,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async deleteWarehouseRack(id) {
    const transaction = await sq.transaction();
    try {
      const warehouseRack = await Master_Warehouse_Rack.findByPk(id);

      if (!warehouseRack) {
        throwValidation(404, "Warehouse rak tidak ditemukan");
      }

      // default rak tak boleh dihapus
      if (warehouseRack.name === "default") {
        throwValidation(400, "default rak tidak bisa dihapus");
      }
      await Master_Warehouse_Rack_Attribute.destroy({
        where: { warehouseRackId: id },
        transaction,
      });

      await Master_Warehouse_Rack.destroy({
        where: { id: id },
        transaction,
      });

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = MasterDataWarehouseService;
