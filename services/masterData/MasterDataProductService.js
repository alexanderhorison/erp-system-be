const {
  Master_Product,
  Master_Product_History,
  Type,
  Category,
} = require("../../models");

class MasterDataProductService {
  static async create(data, user) {
    try {
      const { name, CategoryId, TypeId, description } = data;

      const existingProduct = await Master_Product.findOne({
        where: { name: name },
      });

      if (existingProduct) {
        throw {
          code: 400,
          message: "Nama Produk sudah ada dalam database",
        };
      }

      const createdProduct = await Master_Product.create({
        name: name,
        CategoryId: CategoryId,
        TypeId: TypeId,
        description: description,
      });

      await Master_Product_History.create({
        name: "Create",
        data_before: JSON.stringify(existingProduct),
        data_after: JSON.stringify(createdProduct),
        UserId: user.id, //! Hardcode sementara
      });

      return createdProduct;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, CategoryId, TypeId, description } = data;

      const existingProduct = await Master_Product.findByPk(id);
      if (!existingProduct) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }

      const updatedProduct = await existingProduct.update({
        name: name,
        description: description,
        CategoryId: CategoryId,
        TypeId: TypeId,
      });

      await Master_Product_History.create({
        name: "Update",
        data_before: JSON.stringify(existingProduct),
        data_after: JSON.stringify(updatedProduct),
        UserId: user.id, //! Hardcode sementara
      });

      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const product = await Master_Product.findByPk(id);

      if (!product) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }

      const deleteProduct = await Master_Product.destroy({
        where: { id: id },
      });

      await Master_Product_History.create({
        name: "Delete",
        data_before: JSON.stringify(product),
        data_after: JSON.stringify(deleteProduct),
        UserId: user.id, //! Hardcode sementara
      });

      return deleteProduct;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Product.findAll({
        include: [
          {
            model: Type,
            paranoid: false,
          },
          {
            model: Category,
            paranoid: false,
            attributes: ["name"],
          },
        ],
      });

      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.Category.name,
        type: item.Type.name,
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const product = await Master_Product.findByPk(id, {
        include: [
          {
            model: Type,
            paranoid: false,
          },
          {
            model: Category,
            paranoid: false,
          },
        ],
      });

      if (!product) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        };
      }

      const result = {
        name: product.name,
        CategoryId: product.Category.id,
        TypeId: product.Type.id,
        description: product.description,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductService;
