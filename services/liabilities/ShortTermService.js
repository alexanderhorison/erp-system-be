const moment = require("moment");
const { sequelize: sq, Monthly_Shortterm_Liabilities } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const NotFoundError = "Data Liabilitas Jangka Pendek tidak ditemukan";

class ShortTermService {
  static async create(data) {
    try {
      const newShortTerm = await Monthly_Shortterm_Liabilities.create(data);
      return newShortTerm;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(req) {
    try {
      const { date } = req.query;

      const where = {};

      if (date && moment(date, "YYYY-MM", true).isValid()) {
        where.date = date; // Simple and clean
      }

      const result = await Monthly_Shortterm_Liabilities.findAll({ where, order: [['date', 'DESC']] });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getDetail(id) {
    try {
      const ShortTerm = await Monthly_Shortterm_Liabilities.findByPk(id);
      if (!ShortTerm) {
        throwValidation(404, NotFoundError);
      }
      return ShortTerm;
    } catch (error) {
      throw error;
    }
  }

  static async updateShortTerm(id, data) {
    const transaction = await sq.transaction();
    try {
      const existingData = await Monthly_Shortterm_Liabilities.findByPk(id);

      if (!existingData) {
        throwValidation(404, NotFoundError);
      }

      await existingData.update(data);
      await transaction.commit();
      return "Success Update Data Liabilitas Jangka Pendek";
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async deleteShortTerm(id) {
    try {
      const ShortTerm = await Monthly_Shortterm_Liabilities.findByPk(id);

      if (!ShortTerm) {
        throwValidation(404, NotFoundError);
      }

      await ShortTerm.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ShortTermService;
