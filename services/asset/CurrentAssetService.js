const moment = require("moment");
const { sequelize: sq, Monthly_Current_Assets, Sales_Order } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");

class CurrentAssetService {
  static async findAllAsset(req) {
    try {
      const { period } = req.query;
      const where = {};

      if (period && moment(period, "YYYY-MM", true).isValid()) {
        where.period = period; // Simple and clean
      }

      const result = await Monthly_Current_Assets.findAll({ where, order: [['period', 'DESC']] });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async createAsset(data) {
    try {
      const [year, month] = data.period.split("-");

      // Validate date format
      const period = `${year}-${month}`;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
        throwValidation(400, "Invalid period format. Use YYYY-MM.");
      }

      // Check if the data already exists for the given period
      const findExistData = await Monthly_Current_Assets.findOne({
        where: {
          period, // Direct match
        },
      });

      if (findExistData) {
        throwValidation(400, `Data ${period} sudah ada`);
      }

      // Insert data
      const create = await Monthly_Current_Assets.create({
        ...data,
        period, // Explicitly set the period string
      });

      return create;
    } catch (err) {
      throw err;
    }
  }

  static async updateAsset(id, data) {
    const transaction = await sq.transaction();
    try {
      const existingData = await Monthly_Current_Assets.findByPk(id);

      if (!existingData) {
        throwValidation(404, "Data Asset Tidak Ditemukan");
      }

      await existingData.update(data);
      await transaction.commit();
      return "Success Update Data Asset";
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getDetailAsset(id) {
    try {
      const result = await Monthly_Current_Assets.findByPk(id);

      if (!result) {
        throwValidation(404, "Data Asset Tidak Ditemukan");
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getPiutangSo(period) {
    try {
      const [year, month] = period.split("-").map(Number);
      const result = await Sales_Order.findOne({
        where: {
          [Op.and]: [
            sq.where(sq.literal(`date_part('year', "shippingDate")`), year),
            sq.where(sq.literal(`date_part('month', "shippingDate")`), month),
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

module.exports = CurrentAssetService;
