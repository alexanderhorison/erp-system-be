const { Company, Master_Product } = require("../../models");

class MasterDataCompanyService {
  static async create(data) {
    try {
      const { name, description } = data;

      const existingCompany = await Company.findOne({
        where: { name: name },
      });

      if (existingCompany) {
        throw {
          code: 400,
          message: "Nama Company sudah ada dalam database",
        };
      }

      return Company.create({
        name: name,
        description: description,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { name, description } = data;

      const existingCompany = await Company.findByPk(id);

      if (!existingCompany) {
        throw {
          code: 404,
          message: "Company tidak ditemukan",
        };
      }

      const updatedCompany = await existingCompany.update({
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
      const company = await Company.findByPk(id);

      if (!company) {
        throw {
          code: 404,
          message: "Company tidak ditemukan",
        };
      }

      // find product that have company
      const existProduct = await Master_Product.findOne({
        where: { CompanyId: id },
      });

      if (existProduct) {
        throw {
          code: 400,
          message:
            "Tidak bisa menghapus company, karna ada product yang memiliki company ini",
        };
      }

      const deleteCompany = await Company.destroy({
        where: { id: id },
      });

      return deleteCompany;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Company.findAll();
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
      const company = await Company.findByPk(id);

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
      throw error;
    }
  }
}

module.exports = MasterDataCompanyService;
