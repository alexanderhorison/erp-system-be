const { Master_Type, Master_Product } = require("../../models");

class MasterDataTypeService {
  static async create(data, user) {
    try {
      const { name, description } = data;

      const existingType = await Master_Type.findOne({
        where: { name: name },
      });

      if (existingType) {
        throw {
          code: 400,
          message: "Nama Tipe sudah ada dalam database",
        };
      }

      return Master_Type.create({
        name: name,
        description: description,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, description } = data;

      const existingType = await Master_Type.findByPk(id);

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
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const type = await Master_Type.findByPk(id);

      if (!type) {
        return res.status(404).json({
          success: false,
          message: "Type tidak ditemukan",
        });
      }

      // find product that have type
      const existType = await Master_Product.findOne({
        where: { typeId: id },
      });

      if (existType) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus tipe, karna ada product yang memiliki tipe ini",
        };
      }

      const deleteType = await Master_Type.destroy({
        where: { id: id },
      });

      return deleteType;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Type.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const type = await Master_Type.findByPk(id);

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
      throw error;
    }
  }
}

module.exports = MasterDataTypeService;
