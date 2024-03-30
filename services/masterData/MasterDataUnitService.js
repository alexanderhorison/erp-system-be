const { Unit } = require("../../models");

class MasterDataUnitService {
  static async create(data, user) {
    const { name, description } = data;

    const existingUnit = await Unit.findOne({
      where: { name: name },
    });

    if (existingUnit) {
      throw {
        code: 400,
        message: "Nama unit sudah ada dalam database",
      };
    }

    return Unit.create({
      name: name,
      description: description,
    });
  }

  static async update(id, data, user) {
    try {
      const { name, description } = data;

      const existingUnit = await Unit.findByPk(id);

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
      return error;
    }
  }

  static async delete(id, user) {
    try {
      const unit = await Unit.findByPk(id);

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit tidak ditemukan",
        });
      }

      const deleteUnit = await Unit.destroy({
        where: { id: id },
      });

      return deleteUnit;
    } catch (error) {
      return error;
    }
  }

  static async findAll() {
    try {
      const data = await Unit.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description
      }));
      return result;
    } catch (error) {
      return error;
    }
  }

  static async findOne(id) {
    try {
      const unit = await Unit.findByPk(id);

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
      return error;
    }
  }
}

module.exports = MasterDataUnitService;
