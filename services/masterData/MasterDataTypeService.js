const { Type } = require("../../models");

class MasterDataTypeService {
  static async create(data, user) {
    try {
      const { name, description } = data;

      const existingType = await Type.findOne({
        where: { name: name },
      });

      if (existingType) {
        throw {
          code: 400,
          message: "Nama Tipe sudah ada dalam database",
        };
      }

      return Type.create({
        name: name,
        description: description,
      });
    } catch (error) {
      return error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, description } = data;

      const existingType = await Type.findByPk(id);

      if (!existingType) {
        throw {
          code: 404,
          message: "Tipe tidak ditemukan",
        };
      }

      const updatedType = await existingType.update({
        name: name,
        description: description,
      });

      return updatedType;
    } catch (error) {
      return error;
    }
  }

  static async delete(id, user) {
    try {
      const type = await Type.findByPk(id);

      if (!type) {
        return res.status(404).json({
          success: false,
          message: "Type tidak ditemukan",
        });
      }

      const deleteType = await Type.destroy({
        where: { id: id },
      });

      return deleteType;
    } catch (error) {
      return error;
    }
  }

  static async findAll() {
    try {
      const data = await Type.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));
      return result;
    } catch (error) {
      return error;
    }
  }

  static async findOne(id) {
    try {
      const type = await Type.findByPk(id);

      if (!type) {
        throw {
          code: 404,
          message: "Type tidak ditemukan",
        };
      }

      const result = {
        id: type.id,
        name: type.name,
        description: type.description,
      };

      return result;
    } catch (error) {
      return error;
    }
  }
}

module.exports = MasterDataTypeService;
