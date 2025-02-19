const {
  sequelize: sq,
  Config,
} = require("../../models");

class ConfigService {

  static async create({ payload }) {
    try {
      // UNTUK KEY UNIQUE, TAPI BISA DIJADIKAN 1 CATEGORY
      const exsisting = await Config.findOne({
        where: {
          key: payload.key
        }
      })

      if (exsisting) {
        throw {
          code: 400,
          message: "Config sudah ada"
        }
      }

      const data = await Config.create(payload)

      return data
    } catch (error) {
      throw error
    }
  }

  static async get({ key }) {
    try {
      const data = await Config.findOne({
        where: {
          key: key
        }
      })

      if (!data) {
        throw {
          code: 400,
          message: "Config sudah ada"
        }
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async update({ payload }) {
    try {
      const exsisting = await Config.findOne({
        where: {
          key: payload.key
        }
      })

      if (!exsisting) {
        throw {
          code: 404,
          message: "Config tidak ditemukan"
        }
      }

      const data = await Config.update(payload, {
        where: {
          key: payload.key
        }
      })

      return data
    } catch (error) {
      throw error
    }
  }

}

module.exports = ConfigService