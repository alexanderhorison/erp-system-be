const { Master_Category, Master_Product } = require("../../models");

class MasterDataCategoryService {
  static async create(data, user) {
    try {
      const { name, description } = data;

      const existingMasterCategory = await Master_Category.findOne({
        where: { name: name },
      });

      if (existingMasterCategory) {
        throw {
          code: 400,
          message: "Nama kategori sudah ada dalam database",
        };
      }

      return Master_Category.create({
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

      const existingMasterCategory = await Master_Category.findByPk(id);

      if (!existingMasterCategory) {
        throw {
          code: 404,
          message: "kategori tidak ditemukan",
        };
      }

      const updatedCategory = await existingMasterCategory.update({
        name: name,
        description: description,
      });

      return updatedCategory;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const category = await Master_Category.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "Kategori tidak ditemukan"
        }
      }

      // find product that have category
      const existCategory = await Master_Product.findOne({
        where: { categoryId: id },
      });

      if (existCategory) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus category, karna ada product yang memiliki category ini",
        };
      }

      const deleteCategory = await Master_Category.destroy({
        where: { id: id },
      });

      return deleteCategory;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Category.findAll();
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
      const category = await Master_Category.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "Master kategori tidak ditemukan",
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
