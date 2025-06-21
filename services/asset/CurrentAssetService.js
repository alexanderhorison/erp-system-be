const moment = require("moment");
const { sequelize: sq, Trx_Current_Assets } = require("../../models");
const { Op, Sequelize } = require("sequelize");
const { throwValidation } = require("../../helpers/responses");

class CurrentAssetService {
  static async findAllAsset(req) {
    try {
      const { date } = req.query;
      const where = {};

      if (date && moment(date, "YYYY-MM", true).isValid()) {
        const [year, month] = date.split("-");

        where[Op.and] = [
          Sequelize.where(
            Sequelize.literal(`date_part('year', "date")`),
            parseInt(year)
          ),
          Sequelize.where(
            Sequelize.literal(`date_part('month', "date")`),
            parseInt(month)
          ),
        ];
      }

      const result = await Trx_Current_Assets.findAll({
        where,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
  static async createAsset(data) {
    try {
      const [year, month] = data.date.split("-");

      // check for the data month and year
      const findExistData = await Trx_Current_Assets.findOne({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.literal(`date_part('year', "date")`),
              parseInt(year)
            ),
            Sequelize.where(
              Sequelize.literal(`date_part('month', "date")`),
              parseInt(month)
            ),
          ],
        },
      });

      if (findExistData) {
        throwValidation(400, `Data ${year}-${month} sudah ada`);
      }

      const create = await Trx_Current_Assets.create(data);
      return create;
    } catch (err) {
      throw err;
    }
  }

  static async updateAsset(id, data) {
    const transaction = await sq.transaction();
    try {
      const existingData = await Trx_Current_Assets.findByPk(id);

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
      const result = await Trx_Current_Assets.findByPk(id);

      if (!result) {
        throwValidation(404, "Data Asset Tidak Ditemukan");
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CurrentAssetService;
