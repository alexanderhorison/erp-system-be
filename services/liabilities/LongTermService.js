const moment = require("moment");
const { sequelize: sq, Monthly_Longterm_Liabilities, Purchase_Order } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const NotFoundError = "Data Liabilitas Jangka Panjang tidak ditemukan";
const { Op } = require("sequelize");

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

      const result = await Monthly_Longterm_Liabilities.findAll({ where, order: [['date', 'DESC']] });

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

    static async getPiutangPo(date) {
      try {
        const [year, month] = date.split("-").map(Number);
        const result = await Purchase_Order.findOne({
          where: {
            [Op.and]: [
              sq.where(sq.literal(`date_part('year', "approvedAt")`), year),
              sq.where(sq.literal(`date_part('month', "approvedAt")`), month),
            ],
            status: "APPROVED"
          },
          attributes: [
            [sq.fn('SUM', sq.col('amountDebt')), 'totalAmountDebt']
          ],
          raw: true
        })
  
        return result?.totalAmountDebt || 0;
      } catch (error) {
        throw error;
      }
    }
}

module.exports = LongTermService;
