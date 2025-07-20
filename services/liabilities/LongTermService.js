const moment = require("moment");
const {
  sequelize: sq,
  Monthly_Longterm_Liabilities,
  Purchase_Order,
} = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const NotFoundError = "Data Liabilitas Jangka Panjang tidak ditemukan";

class LongTermService {
  static async create(data) {
    try {
      const newLongTerm = await Monthly_Longterm_Liabilities.create(data);
      return newLongTerm;
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

      const result = await Monthly_Longterm_Liabilities.findAll({
        where,
        order: [["date", "DESC"]],
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getDetail(id) {
    try {
      const longTerm = await Monthly_Longterm_Liabilities.findByPk(id);
      if (!longTerm) {
        throwValidation(404, NotFoundError);
      }
      return longTerm;
    } catch (error) {
      throw error;
    }
  }

  static async updateLongTerm(id, data) {
    const transaction = await sq.transaction();
    try {
      const existingData = await Monthly_Longterm_Liabilities.findByPk(id);

      if (!existingData) {
        throwValidation(404, NotFoundError);
      }

      await existingData.update(data);
      await transaction.commit();
      return existingData;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async deleteLongTerm(id) {
    try {
      const longTerm = await Monthly_Longterm_Liabilities.findByPk(id);

      if (!longTerm) {
        throwValidation(404, NotFoundError);
      }

      await longTerm.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailByPeriod(date) {
    try {
      const longTerm = await Monthly_Longterm_Liabilities.findOne({
        where: { date },
      });
      if (!longTerm) {
        return {
          shareHolderLoans: 0, // Pinjaman kepada Pemegang Saham
          longTermBankLoans: 0, // Hutang Bank Jangka Panjang
          otherLongtermLiabilities: 0, // Kewajiban Jangka Panjang
          totalLongtermLiabilities: 0, // Jumlah Liabilitas Jangka Panjang
        };
      }
      return {
        shareHolderLoans: longTerm.shareHolderLoans || 0, // Pinjaman kepada Pemegang Saham
        longTermBankLoans: longTerm.longTermBankLoans || 0, // Hutang Bank Jangka Panjang
        otherLongtermLiabilities: longTerm.otherLongtermLiabilities || 0, // Kewajiban Jangka Panjang
        totalLongtermLiabilities: longTerm.totalLongtermLiabilities || 0, // Jumlah Liabilitas Jangka Panjang
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LongTermService;
