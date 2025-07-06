const moment = require("moment");
const { sequelize: sq, Monthly_Shortterm_Liabilities, Purchase_Order } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const NotFoundError = "Data Liabilitas Jangka Pendek tidak ditemukan";
const { Op } = require("sequelize");

class ShortTermService {
  static async create(data) {
    try {
      const [year, month, day] = data.date.split("-");

      // Validate date format
      const date = `${year}-${month}-${day}`;
      console.log(date);
      if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)) {
        throwValidation(400, "Invalid period format. Use YYYY-MM-DD.");
      }

      // Check if the data already exists for the given period
      const findExistData = await Monthly_Shortterm_Liabilities.findOne({
        where: {
          date, // Direct match
        },
      });

      if (findExistData) {
        const d = new Date(date);
        // Format as "Mon YYYY"
        const month = d.toLocaleString("en-US", { month: "short" }); // "Mar"
        const year = d.getFullYear(); // 2025
        const formatted = `${month} ${year}`;
        throwValidation(400, `Data ${formatted} sudah ada`);
      }

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

module.exports = ShortTermService;
