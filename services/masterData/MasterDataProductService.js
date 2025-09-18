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
const { generateFilter } = require("../../helpers/queryGenerator");
const { buildQueryOptions, buildPaginationResponse } = require("../../helpers/queryBuilderHelper");

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
        companyId: companyId,
      });

      const dataLogBefore = createdProduct.get({ plain: true });
      delete dataLogBefore.id;

      await Product_Log.create({
        name: "Create",
        dataBefore: JSON.stringify(existingProduct),
        dataAfter: JSON.stringify(dataLogBefore),
        userId: user.id, //! Hardcode sementara
        productId: createdProduct?._previousDataValues?.id,
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
        companyId: companyId,
      });

      const dataLogAfter = updatedProduct.get({ plain: true });
      delete dataLogAfter.id;

      // remove id
      const dataLogBefore = existingProduct.get({ plain: true });
      delete dataLogBefore.id;

      await Product_Log.create({
        name: "Update",
        dataBefore: JSON.stringify(dataLogBefore),
        dataAfter: JSON.stringify(dataLogAfter),
        userId: user.id, //! Hardcode sementara,
        productId: existingProduct?._previousDataValues?.id,
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

      // find Master Transformation that have unit
      const existTransformation = await Master_Product_Transformation.findOne({
        where: { masterProductId: id },
      });

      if (existTransformation) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus product, karna ada rumus transformasi yang memiliki product ini",
        };
      }

      // remove id
      const dataLogBefore = product.get({ plain: true });
      delete dataLogBefore.id;

      const deleteProduct = await Master_Product.destroy({
        where: { id: id },
      });

      await Product_Log.create({
        name: "Delete",
        dataBefore: JSON.stringify(dataLogBefore),
        dataAfter: JSON.stringify(deleteProduct),
        userId: user.id, //! Hardcode sementara
        productId: product?._previousDataValues?.id,
      });

      return deleteProduct;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(req) {
    try {
      const { categoryId, typeId, companyId } = req.query;

      // Build query options using helper
      const queryOptions = buildQueryOptions(req.query, {
        searchFields: ['name', 'description'],
        additionalWhere: {},
        enableDate: false,
      });

      // Generate filters for category, type, and company
      let queryFilter = {};
      if (req.query != {}) {
        const filters = [
          {
            column: "categoryId",
            operator: "=",
            value: categoryId,
            model: "Master_Product",
          },
          {
            column: "typeId",
            operator: "=",
            value: typeId,
            model: "Master_Product",
          },
          {
            column: "companyId",
            operator: "=",
            value: companyId,
            model: "Master_Product",
          },
        ];
        queryFilter = generateFilter(filters);
      }

      // Merge query options with additional filters
      const whereCondition = {
        ...queryOptions.where,
        ...(queryFilter.Master_Product || {}),
      };

      const data = await Master_Product.findAndCountAll({
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
        where: whereCondition,
        order: queryOptions.order,
        limit: queryOptions.limit,
        offset: queryOptions.offset,
      });

      const result = data.rows.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.Master_Category.name,
        type: item.Master_Type.name,
        company: item.Master_Company ? item.Master_Company.name : "",
      }));

      return {
        data: result,
        pagination: buildPaginationResponse(data, req.query),
      };
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
        companyId: product.Master_Company.id,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getAllProductTransformasi(productId) {
    try {
      const data = await Master_Product_Transformation.findAll({
        attributes: ["id", "masterProductId", "info", "code"],
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
      // Filter double data by code
      const filterUniqueTransformationId = data.reduce((acc, item) => {
        const found = acc.find(
          (existingItem) => existingItem.code === item.code
        );
        if (!found) {
          acc.push({
            id: item.id,
            masterProductId: item.masterProductId,
            info: item.info,
            code: item.code,
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

      const code = await generateProductTransformationId();

      // Data 1
      const productTransformasiData1 = {
        masterProductId,
        unitFromId,
        amountFrom,
        unitToId,
        amountTo,
        info: info1 || "",
        createdBy: userId,
        code,
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
        code,
      };

      // Pembuatan Product Transformasi Data
      await Master_Product_Transformation.create(productTransformasiData1, {
        transaction,
      });
      await Master_Product_Transformation.create(productTransformasiData2, {
        transaction,
      });

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
        code,
        info1,
        info2,
      } = data;

      const existingTransformasi = await Master_Product_Transformation.findByPk(
        id
      );

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

      await existingTransformasi.update(updateTransformasiData1, {
        transaction,
      });

      const existingTransformasi2 = await Master_Product_Transformation.findOne(
        {
          where: {
            code,
            id: { [Op.ne]: id },
          },
        }
      );

      // Data 2
      const updateTransformasiData2 = {
        unitFromId: unitToId,
        unitToId: unitFromId,
        amountFrom: amountTo,
        amountTo: amountFrom,
        info: info2,
      };

      await existingTransformasi2.update(updateTransformasiData2, {
        transaction,
      });

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
        code: transformasi.code,
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

      const code = transformasi.code;

      const deleteTransformation = await Master_Product_Transformation.destroy({
        where: { code },
      });

      return deleteTransformation;
    } catch (error) {
      throw error;
    }
  }

  // Get Transformation by productId and UnitId
  static async getListTransformation({ data }) {
    try {
      const listData = await Master_Product_Transformation.findAll({
        where: {
          masterProductId: data.productId,
          unitFromId: data.unitId,
        },
        include: [
          {
            model: Master_Unit,
            as: "unitFrom",
          },
          {
            model: Master_Unit,
            as: "unitTo",
          },
        ],
      });

      return listData || [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductService;
