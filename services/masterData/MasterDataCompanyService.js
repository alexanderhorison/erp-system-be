const { Master_Company, Master_Product } = require("../../models");
const { Op } = require("sequelize");

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
      const { 
        page = 1, 
        pageSize = 10, 
        search = "",
        sortBy = "name",
        sortOrder = "ASC"
      } = query;

      let whereConditions = {};

      // Add search functionality
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Define valid sort fields
      const validSortFields = ['name', 'createdAt', 'updatedAt'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'name';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const { count, rows } = await Master_Company.findAndCountAll({
        where: whereConditions,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [[orderField, orderDirection]],
      });

      const result = rows.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return {
        data: result,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / parseInt(pageSize)),
        },
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
