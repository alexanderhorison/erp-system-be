const {
  Master_Product,
  Master_Product_History,
  Type,
  Category,
  Company,
  Master_Transformation,
  Unit,
  sequelize: sq,
} = require("../../models");
const {
  generateProductTransformationId,
} = require("../../helpers/transformationIdGenerator");
const { Op } = require("sequelize");
const { generateFilter } = require('../../helpers/queryGenerator');

class MasterDataProductService {
  static async create(data, user) {
    try {
      const { name, CategoryId, TypeId, description, CompanyId } = data;

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
        CompanyId: CompanyId
      });

      await Master_Product_History.create({
        name: "Create",
        data_before: JSON.stringify(existingProduct),
        data_after: JSON.stringify(createdProduct),
        UserId: user.id, //! Hardcode sementara
      });

      return createdProduct;
    } catch (error) {
      console.log(error, 'error in service create product');
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, CategoryId, TypeId, description, CompanyId } = data;

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
        CompanyId: CompanyId
      });

      await Master_Product_History.create({
        name: "Update",
        data_before: JSON.stringify(existingProduct),
        data_after: JSON.stringify(updatedProduct),
        UserId: user.id, //! Hardcode sementara
      });

      return updatedProduct;
    } catch (error) {
      console.log(error, 'error in service update product');
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

  static async findAll(req) {
    try {
      const { CategoryId, TypeId, CompanyId } = req.query;

      let queryFilter = {};

      if (req.query != {}){
        const filters = [
          { column: "CategoryId", operator: "=", value: CategoryId },
          { column: "TypeId", operator: "=", value: TypeId },
          { column: "CompanyId", operator: "=", value: CompanyId },
        ]
        queryFilter = generateFilter(filters)
      }

      const data = await Master_Product.findAll({
        include: [
          {
            model: Type,
            paranoid: false,
            attributes: ["name"],
          },
          {
            model: Category,
            paranoid: false,
            attributes: ["name"],
          },
          {
            model: Company,
            attributes: ["name"],
          },
        ],
        where: queryFilter
      });

      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.Category.name,
        type: item.Type.name,
        company: item.Company ? item.Company.name : '',
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
          {
            model: Company,
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
        id: product.id,
        name: product.name,
        CategoryId: product.Category.id,
        TypeId: product.Type.id,
        description: product.description,
        CompanyId: product.Company.id
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getAllProductTransformasi(productId) {
    try {
      const data = await Master_Transformation.findAll({
        attributes: [
          "id",
          "MasterProductId",
          "info",
          "product_transformation_id",
          // Add other columns you need from Master_Transformation
        ],
        include: [
          {
            model: Unit,
            paranoid: false,
            attributes: ["name"],
            as: "UnitFrom",
          },
          {
            model: Unit,
            paranoid: false,
            attributes: ["name"],
            as: "UnitTo",
          },
          {
            model: Master_Product,
            paranoid: false,
            attributes: ["id", "name"],
          },
        ],
        where: {
          MasterProductId: productId,
          deletedAt: null,
        },
        order: [["id", "ASC"]],
        raw: true,
      });

      // Ini bisa di enhance dengan penambahan field di db kolom active jadi hanya get yang active
      // Filter double data by product_transformation_id
      const filterUniqueTransformationId = data.reduce((acc, item) => {
        const found = acc.find(
          (existingItem) =>
            existingItem.product_transformation_id ===
            item.product_transformation_id
        );
        if (!found) {
          acc.push({
            id: item.id,
            MasterProductId: item.MasterProductId,
            info: item.info,
            product_transformation_id: item.product_transformation_id,
          });
        }
        return acc;
      }, []);

      return filterUniqueTransformationId;
    } catch (error) {
      throw error;
    }
  }

  static async createProductTransformasi(data, userId) {
    const transaction = await sq.transaction();
    try {
      const {
        MasterProductId,
        UnitFromId,
        amount_from,
        UnitToId,
        amount_to,
        info1,
        info2,
      } = data;

      const product_transformation_id = await generateProductTransformationId();

      // Data 1
      const productTransformasiData1 = {
        MasterProductId,
        UnitFromId,
        amount_from,
        UnitToId,
        amount_to,
        info: info1 || "",
        createdBy: userId,
        product_transformation_id,
      };

      // Data 2
      const productTransformasiData2 = {
        MasterProductId,
        UnitFromId: UnitToId,
        UnitToId: UnitFromId,
        amount_from: amount_to,
        amount_to: amount_from,
        info: info2 || "",
        createdBy: userId,
        product_transformation_id,
      };

      // Pembuatan Product Transformasi Data
      await Master_Transformation.create(productTransformasiData1, {
        transaction,
      });
      await Master_Transformation.create(productTransformasiData2, {
        transaction,
      });

      await transaction.commit();
      return;
    } catch (error) {
      console.log(error, ' error create product transformation service');
      await transaction.rollback();
      throw error;
    }
  }

  static async updateProductTransformasi(id, data) {
    const transaction = await sq.transaction();
    try {
      const {
        MasterProductId,
        UnitFromId,
        amount_from,
        UnitToId,
        amount_to,
        product_transformation_id,
        info1,
        info2,
      } = data;

      const existingTransformasi = await Master_Transformation.findByPk(id);

      if (!existingTransformasi) {
        throw {
          code: 404,
          message: "rumus transformasi tidak ditemukan",
        };
      }

      // Data 1
      const updateTransformasiData1 = {
        UnitFromId,
        amount_from,
        UnitToId,
        amount_to,
        info: info1,
      };

      await existingTransformasi.update(updateTransformasiData1);

      const existingTransformasi2 = await Master_Transformation.findOne({
        where: {
          product_transformation_id,
          id: { [Op.ne]: id },
        },
      });

      // Data 2
      const updateTransformasiData2 = {
        UnitFromId: UnitToId,
        UnitToId: UnitFromId,
        amount_from: amount_to,
        amount_to: amount_from,
        info: info2,
      };

      await existingTransformasi2.update(updateTransformasiData2);

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getDetailTransformasi(id) {
    try {
      const transformasi = await Master_Transformation.findByPk(id, {
        include: [
          {
            model: Unit,
            paranoid: false,
            attributes: ["id", "name"],
            as: "UnitFrom",
          },
          {
            model: Unit,
            paranoid: false,
            attributes: ["id", "name"],
            as: "UnitTo",
          },
          {
            model: Master_Product,
            paranoid: false,
            attributes: ["id", "name"],
          },
        ],
      });

      if (!transformasi) {
        throw {
          code: 404,
          message: "Rumus Transformasi tidak ditemukan",
        };
      }

      const result = {
        id: transformasi.id,
        MasterProductId: transformasi.MasterProductId,
        UnitFromId: transformasi.UnitFromId,
        UnitToId: transformasi.UnitToId,
        amount_to: transformasi.amount_to,
        product_transformation_id: transformasi.product_transformation_id,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async deleteProductTransformasi(id) {
    try {
      const transformasi = await Master_Transformation.findByPk(id);

      if (!transformasi) {
        throw {
          code: 404,
          message: "rumus transformasi tidak ditemukan",
        };
      }

      const product_transformation_id = transformasi.product_transformation_id;

      const deleteTransformation = await Master_Transformation.destroy({
        where: { product_transformation_id },
      });

      return deleteTransformation;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductService;
