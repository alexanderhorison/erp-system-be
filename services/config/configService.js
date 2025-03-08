const {
  sequelize: sq,
  Config,
} = require("../../models");

class ConfigService {

  static async getAllConfig({ query }) {
    try {
      const data = await Config.findAll({
        where: query
      })

      return data
    } catch (error) {
      throw error
    }
  }

  static async create({ payload }) {
    try {
      // UNTUK KEY UNIQUE, TAPI BISA DIJADIKAN 1 CATEGORY
      const exsisting = await Config.findOne({
        where: {
          key: payload.key,
          value: payload.value
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

  static async get({ query }) {
    try {
      const data = await Config.findOne({
        where: query
      })

      if (!data) {
        throw {
          code: 404,
          message: "Config tidak ditemukan"
        }
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async update({ id, payload }) {
    try {
      const exsisting = await Config.findOne({
        where: {
          id: id
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
          id: id
        }
      })

      return data
    } catch (error) {
      throw error
    }
  }

  static async delete({ query }) {
    try {
      const data = await Config.destroy({
        where: query
      })

      return data
    } catch (error) {
      throw error
    }
  }

}

module.exports = ConfigService