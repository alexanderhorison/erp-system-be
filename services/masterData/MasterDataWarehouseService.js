const { Master_Warehouse } = require("../../models");

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

    return Master_Warehouse.create({
      name: name,
      description: description,
      location: location,
    });
  }

  static async update(id, data, user) {
    try {
      const { name, description, location } = data;
      const existingWarehouse = await Master_Warehouse.findByPk(id);

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

      return updatedWarehouse;
    } catch (error) {
      return error;
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

      const deleteWarehouse = await Master_Warehouse.destroy({
        where: { id: id },
      });

      return deleteWarehouse;
    } catch (error) {
      return error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Warehouse.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        location: item.location,
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const warehouse = await Master_Warehouse.findByPk(id);

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
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataWarehouseService;
