const { Tm_Unexpected_Cost_Categories } = require("../../models");

class MasterDataUnexpectedCostCategoryService {
  static async create(data, user) {
    try {
      const { name, description, is_active } = data;

      const existingCategory = await Tm_Unexpected_Cost_Categories.findOne({
        where: { name: name },
      });

      if (existingCategory) {
        throw {
          code: 400,
          message: "Nama kategori biaya tidak terduga sudah ada dalam database",
        };
      }

      return Tm_Unexpected_Cost_Categories.create({
        name: name,
        description: description,
        is_active: is_active ?? true,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, description, is_active } = data;

      const existingCategory = await Tm_Unexpected_Cost_Categories.findByPk(id);

      if (!existingCategory) {
        throw {
          code: 404,
          message: "Kategori biaya tidak terduga tidak ditemukan",
        };
      }

      // Check if name already exists for other category
      if (name !== existingCategory.name) {
        const duplicateName = await Tm_Unexpected_Cost_Categories.findOne({
          where: { name: name },
        });

        if (duplicateName) {
          throw {
            code: 400,
            message: "Nama kategori biaya tidak terduga sudah ada dalam database",
          };
        }
      }

      const updatedCategory = await existingCategory.update({
        name: name,
        description: description,
        is_active: is_active,
      });

      return updatedCategory;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const category = await Tm_Unexpected_Cost_Categories.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "Kategori biaya tidak terduga tidak ditemukan"
        };
      }

      // Update is_active to false instead of deleting the record
      const updatedCategory = await category.update({
        is_active: false,
      });

      return updatedCategory;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(query) {
    try {
      const data = await Tm_Unexpected_Cost_Categories.findAll({
        where: {
          ...(query.active !== undefined && {
            is_active: query.active,
          }),
        }
      });
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        is_active: item.is_active,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const category = await Tm_Unexpected_Cost_Categories.findByPk(id);

      if (!category) {
        throw {
          code: 404,
          message: "Kategori biaya tidak terduga tidak ditemukan",
        };
      }

      const result = {
        id: category.id,
        name: category.name,
        description: category.description,
        is_active: category.is_active,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataUnexpectedCostCategoryService;