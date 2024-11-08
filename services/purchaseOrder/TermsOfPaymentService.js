const {
  sequelize: sq,
  Term_Of_Payment,
  Purchase_Order

} = require("../../models");

class TermsOfPaymentService {

  static async getAll({ purchaseOrderCode }) {
    try {
      const po = await Purchase_Order.findOne({
        where: {
          code: purchaseOrderCode
        }
      })
      const data = await Term_Of_Payment.findAll({
        where: {
          purchaseOrderId: po.id
        }
      })
      const result = data.map(item => {
        const temp = item.dataValues
        return {
          ...temp,
          dueDate: new Date(temp.dueDate),
        }
      })
      return result
    } catch (error) {
      throw error
    }
  }

  static async findOne({ id }) {
    try {
      const data = await Term_Of_Payment.findOne({
        where: {
          id: id
        }
      })
      if (!data) {
        throw { code: 400, message: "Data tidak ditemukan" }
      }
      return data
    } catch (error) {
      throw error
    }
  }

  static async create({ data }) {
    const transaction = await sq.transaction();
    try {
      const approvedData = await Purchase_Order.findOne({
        where: {
          id: data.purchaseOrderId
        }
      })
      if (!approvedData) {
        throw { code: 400, message: "Data tidak ditemukan" }
      }
      if (approvedData.status !== "APPROVED") {
        throw { code: 400, message: "Data belum di approve" }
      }
      const created = await Term_Of_Payment.create(data, { transaction })
      await transaction.commit();
      return created
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async update({ id, data }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Term_Of_Payment.findOne({
        where: {
          id: id
        }
      })
      if (!exsistingData) {
        throw { code: 400, message: "Data tidak ditemukan" }
      }
      const updated = await exsistingData.update(data, { transaction })
      await transaction.commit();
      return updated
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

  static async delete({ id }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Term_Of_Payment.findOne({
        where: {
          id: id
        }
      })
      if (!exsistingData) {
        throw { code: 400, message: "Data tidak ditemukan" }
      }
      const deleted = await exsistingData.destroy({ transaction })
      await transaction.commit();
      return deleted
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }

}

module.exports = TermsOfPaymentService
