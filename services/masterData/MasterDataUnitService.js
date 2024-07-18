const { Master_Unit } = require("../../models");

class MasterDataUnitService {
  static async create(data, user) {
    try {
      const { name, description } = data;
  
      const existingUnit = await Master_Unit.findOne({
        where: { name: name },
      });
  
      if (existingUnit) {
        throw {
          code: 400,
          message: "Nama unit sudah ada dalam database",
        };
      }
  
      return Master_Unit.create({
        name: name,
        description: description,
      });
    } catch (error) {
      throw error
    }
  }

  static async update(id, data, user) {
    try {
      const { name, description } = data;

      const existingUnit = await Master_Unit.findByPk(id);

      if (!existingUnit) {
        throw {
          code: 404,
          message: "Unit tidak ditemukan",
        };
      }

      const updatedUnit = await existingUnit.update({
        name: name,
        description: description,
      });

      return updatedUnit;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const unit = await Master_Unit.findByPk(id);

      if (!unit) {
        throw {
          code: 404,
          message: "Unit tidak ditemukan",
        };
      }

      const deleteUnit = await Master_Unit.destroy({
        where: { id: id },
      });

      return deleteUnit;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Unit.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const unit = await Master_Unit.findByPk(id);

      if (!unit) {
        throw {
          code: 404,
          message: "Unit tidak ditemukan",
        };
      }

      const result = {
        id: unit.id,
        name: unit.name,
        description: unit.description
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataUnitService;
