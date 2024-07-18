const {
  Master_Product,
  Product_Log,
  Master_Type,
  Master_Category,
  Master_Company,
  Master_Product_Transformation,
  Master_Unit,
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
      const { name, categoryId, typeId, description, companyId } = data;

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
        categoryId: categoryId,
        typeId: typeId,
        description: description,
        companyId: companyId
      });

      await Product_Log.create({
        name: "Create",
        dataBefore: JSON.stringify(existingProduct),
        dataAfter: JSON.stringify(createdProduct),
        userId: user.id, //! Hardcode sementara
      });

      return createdProduct;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, categoryId, typeId, description, companyId } = data;

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
        categoryId: categoryId,
        typeId: typeId,
        companyId: companyId
      });

      await Product_Log.create({
        name: "Update",
        dataBefore: JSON.stringify(existingProduct),
        dataAfter: JSON.stringify(updatedProduct),
        userId: user.id, //! Hardcode sementara
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

      await Product_Log.create({
        name: "Delete",
        dataBefore: JSON.stringify(product),
        dataAfter: JSON.stringify(deleteProduct),
        userId: user.id, //! Hardcode sementara
      });

      return deleteProduct;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(req) {
    try {
      const { categoryId, typeId, companyId } = req.query;

      let queryFilter = {};

      if (req.query != {}){
        const filters = [
          { column: "categoryId", operator: "=", value: categoryId },
          { column: "typeId", operator: "=", value: typeId },
          { column: "companyId", operator: "=", value: companyId },
        ]
        queryFilter = generateFilter(filters)
      }

      const data = await Master_Product.findAll({
        include: [
          {
            model: Master_Type,
            paranoid: false,
            attributes: ["name"],
          },
          {
            model: Master_Category,
            paranoid: false,
            attributes: ["name"],
          },
          {
            model: Master_Company,
            attributes: ["name"],
          },
        ],
        where: queryFilter
      });

      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.Master_Category.name,
        type: item.Master_Type.name,
        company: item.Master_Company ? item.Master_Company.name : '',
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
            model: Master_Type,
            paranoid: false,
          },
          {
            model: Master_Category,
            paranoid: false,
          },
          {
            model: Master_Company,
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
        categoryId: product.Master_Category.id,
        typeId: product.Master_Type.id,
        description: product.description,
        companyId: product.Master_Company.id
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getAllProductTransformasi(productId) {
    try {
      const data = await Master_Product_Transformation.findAll({
        attributes: [
          "id",
          "masterProductId",
          "info",
          "productTransformationId",
        ],
        include: [
          {
            model: Master_Unit,
            paranoid: false,
            attributes: ["name"],
            as: "unitFrom",
          },
          {
            model: Master_Unit,
            paranoid: false,
            attributes: ["name"],
            as: "unitTo",
          },
          {
            model: Master_Product,
            paranoid: false,
            attributes: ["id", "name"],
          },
        ],
        where: {
          masterProductId: productId,
          deletedAt: null,
        },
        order: [["id", "ASC"]],
        raw: true,
      });

      // Ini bisa di enhance dengan penambahan field di db kolom active jadi hanya get yang active
      // Filter double data by productTransformationId
      const filterUniqueTransformationId = data.reduce((acc, item) => {
        const found = acc.find(
          (existingItem) =>
            existingItem.productTransformationId ===
            item.productTransformationId
        );
        if (!found) {
          acc.push({
            id: item.id,
            masterProductId: item.masterProductId,
            info: item.info,
            productTransformationId: item.productTransformationId,
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
        masterProductId,
        unitFromId,
        amountFrom,
        unitToId,
        amountTo,
        info1,
        info2,
      } = data;

      const productTransformationId = await generateProductTransformationId();

      // Data 1
      const productTransformasiData1 = {
        masterProductId,
        unitFromId,
        amountFrom,
        unitToId,
        amountTo,
        info: info1 || "",
        createdBy: userId,
        productTransformationId,
      };

      // Data 2
      const productTransformasiData2 = {
        masterProductId,
        unitFromId: unitToId,
        unitToId: unitFromId,
        amountFrom: amountTo,
        amountTo: amountFrom,
        info: info2 || "",
        createdBy: userId,
        productTransformationId,
      };

      // Pembuatan Product Transformasi Data
      await Master_Product_Transformation.create(productTransformasiData1);
      await Master_Product_Transformation.create(productTransformasiData2);

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateProductTransformasi(id, data) {
    const transaction = await sq.transaction();
    try {
      const {
        masterProductId,
        unitFromId,
        amountFrom,
        unitToId,
        amountTo,
        productTransformationId,
        info1,
        info2,
      } = data;

      const existingTransformasi = await Master_Product_Transformation.findByPk(id);

      if (!existingTransformasi) {
        throw {
          code: 404,
          message: "rumus transformasi tidak ditemukan",
        };
      }

      // Data 1
      const updateTransformasiData1 = {
        unitFromId,
        amountFrom,
        unitToId,
        amountTo,
        info: info1,
      };

      await existingTransformasi.update(updateTransformasiData1);

      const existingTransformasi2 = await Master_Product_Transformation.findOne({
        where: {
          productTransformationId,
          id: { [Op.ne]: id },
        },
      });

      // Data 2
      const updateTransformasiData2 = {
        unitFromId: unitToId,
        unitToId: unitFromId,
        amountFrom: amountTo,
        amountTo: amountFrom,
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
      const transformasi = await Master_Product_Transformation.findByPk(id, {
        include: [
          {
            model: Master_Unit,
            paranoid: false,
            attributes: ["id", "name"],
            as: "unitFrom",
          },
          {
            model: Master_Unit,
            paranoid: false,
            attributes: ["id", "name"],
            as: "unitTo",
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
        masterProductId: transformasi.masterProductId,
        unitFromId: transformasi.unitFromId,
        unitToId: transformasi.unitToId,
        amountTo: transformasi.amountTo,
        productTransformationId: transformasi.productTransformationId,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async deleteProductTransformasi(id) {
    try {
      const transformasi = await Master_Product_Transformation.findByPk(id);

      if (!transformasi) {
        throw {
          code: 404,
          message: "rumus transformasi tidak ditemukan",
        };
      }

      const productTransformationId = transformasi.productTransformationId;

      const deleteTransformation = await Master_Product_Transformation.destroy({
        where: { productTransformationId },
      });

      return deleteTransformation;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductService;
