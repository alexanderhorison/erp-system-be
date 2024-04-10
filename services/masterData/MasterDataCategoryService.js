const { Category } = require("../../models");

class MasterDataCategoryService {
  static async create(data, user) {
    try {
      const { name, description } = data;

      const existingCategory = await Category.findOne({
        where: { name: name },
      });

      if (existingCategory) {
        throw {
          code: 400,
          message: "Nama kategori sudah ada dalam database",
        };
      }
      
      return Category.create({
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

      const existingCategory = await Category.findByPk(id);

      if (!existingCategory) {
        throw {
          code: 404,
          message: "kategori tidak ditemukan",
        };
      }

      const updatedCategory = await existingCategory.update({
        name: name,
        description: description,
      });

      return updatedCategory;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "Kategori tidak ditemukan"
        }
      }

      const deleteCategory = await Category.destroy({
        where: { id: id },
      });

      return deleteCategory;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Category.findAll();
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
      const category = await Category.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "kategori tidak ditemukan",
        };
      }

      const result = {
        id: category.id,
        name: category.name,
        description: category.description,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataCategoryService;
