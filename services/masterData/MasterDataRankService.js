const { throwValidation } = require("../../helpers/responses");
const { Master_Rank, Master_Customer } = require("../../models");
const { Op } = require("sequelize");

class MasterDataRankService {
  static async create(data) {
    try {
      const { name, description, level } = data;

      // Find rank that had level or name
      const existingRank = await Master_Rank.findOne({
        where: { [Op.or]: [{ name: name }, { level: level }] },
      });

      if (existingRank) {
        throwValidation(400, "Nama atau level rank sudah ada dalam database");
      }

      return Master_Rank.create({
        name: name,
        level: level,
        description: description,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { name, description, level } = data;

      const existingRank = await Master_Rank.findByPk(id);

      if (!existingRank) {
        throwValidation(404, "Rank Tidak ditemukan");
      }

      // Find rank that had level or name
      const rank = await Master_Rank.findOne({
        where: { [Op.or]: [{ name: name }, { level: level }] },
      });

      if (rank && rank.id !== id) {
        throwValidation(400, "Rank atau level rank sudah ada dalam database");
      }

      const updatedRank = await existingRank.update({
        name: name,
        description: description,
        level: level,
      });

      return updatedRank;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const rank = await Master_Rank.findByPk(id);

      if (!rank) {
        throwValidation(404, "Rank Tidak ditemukan");
      }

      // find Master Customer that have rank
      const existCustomerRank = await Master_Customer.findOne({
        where: {
          rankId: id,
        },
      });

      if (existCustomerRank) {
        throwValidation(
          400,
          "Tidak bisa menghapus rank, karna ada customer yang memiliki rank ini"
        );
      }

      const deleteRank = await Master_Rank.destroy({
        where: { id: id },
      });

      return deleteRank;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Rank.findAll();
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        level: item.level,
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const rank = await Master_Rank.findByPk(id);

      if (!rank) {
        throwValidation(404, "Rank Tidak ditemukan");
      }

      const result = {
        id: rank.id,
        name: rank.name,
        description: rank.description,
        level: rank.level,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataRankService;
