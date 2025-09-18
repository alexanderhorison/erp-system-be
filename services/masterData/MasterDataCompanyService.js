const { Master_Company, Master_Product } = require("../../models");
const { buildQueryOptions, buildPaginationResponse } = require("../../helpers/queryBuilderHelper");

class MasterDataCompanyService {
  static async create(data) {
    try {
      const { name, description } = data;

      const existingMasterCompany = await Master_Company.findOne({
        where: { name: name },
      });

      if (existingMasterCompany) {
        throw {
          code: 400,
          message: "Nama Master Company sudah ada dalam database",
        };
      }

      return Master_Company.create({
        name: name,
        description: description,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { name, description } = data;

      const existingMasterCompany = await Master_Company.findByPk(id);

      if (!existingMasterCompany) {
        throw {
          code: 404,
          message: "Company tidak ditemukan",
        };
      }

      const updatedCompany = await existingMasterCompany.update({
        name: name,
        description: description,
      });

      return updatedCompany;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const company = await Master_Company.findByPk(id);

      if (!company) {
        throw {
          code: 404,
          message: "Company tidak ditemukan",
        };
      }

      // find product that have company
      const existProduct = await Master_Product.findOne({
        where: { companyId: id },
      });

      if (existProduct) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus company, karna ada product yang memiliki company ini",
        };
      }

      const deleteCompany = await Master_Company.destroy({
        where: { id: id },
      });

      return deleteCompany;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(query = {}) {
    try {
      // Build query options using helper
      const queryOptions = buildQueryOptions(query, {
        searchFields: ['name', 'description'],
        enableDate: false,
      });

      const data = await Master_Company.findAndCountAll({
        where: queryOptions.where,
        order: queryOptions.order,
        limit: queryOptions.limit,
        offset: queryOptions.offset,
      });

      const result = data.rows.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));

      return {
        data: result,
        pagination: buildPaginationResponse(data, query),
      };
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const company = await Master_Company.findByPk(id);
      if (!company) {
        throw {
          code: 404,
          message: "Company tidak ditemukan",
        };
      }

      const result = {
        id: company.id,
        name: company.name,
        description: company.description,
      };

      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

module.exports = MasterDataCompanyService;
