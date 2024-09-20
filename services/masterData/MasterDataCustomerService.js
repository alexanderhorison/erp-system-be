const { Master_Rank, Master_Customer } = require("../../models");
const { throwValidation } = require("../../helpers/responses");

class MasterDataCustomerService {
  static async create(data) {
    try {
      const { name, phoneNumber, email, address, gender, notes, rankId } = data;

      const existingCustomer = await Master_Customer.findOne({
        where: { name: name },
      });

      if (existingCustomer) {
        throwValidation(400, "Nama customer sudah ada dalam database");
      }

      return Master_Customer.create({
        name: name,
        phoneNumber: phoneNumber,
        email: email,
        address: address,
        gender: gender,
        notes: notes,
        rankId: rankId,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { name, phoneNumber, email, address, gender, notes, rankId } = data;

      const existingCustomer = await Master_Customer.findByPk(id);

      if (!existingCustomer) {
        throwValidation(400, "Customer tidak ditemukan");
      }

      const findRank = await Master_Rank.findByPk(rankId);

      if (!findRank) {
        throwValidation(400, "Data rank tidak ditemukan");
      }

      const updatedCustomer = await existingCustomer.update({
        name: name,
        phoneNumber: phoneNumber,
        email: email,
        address: address,
        gender: gender,
        notes: notes,
        rankId: rankId,
      });

      return updatedCustomer;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const customer = await Master_Customer.findByPk(id);

      if (!customer) {
        throwValidation(400, "Customer tidak ditemukan");
      }

      const deleteCustomer = await Master_Customer.destroy({
        where: { id: id },
      });

      return deleteCustomer;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Customer.findAll({
        include: [
          {
            model: Master_Rank,
            attributes: ["name"],
          },
        ],
      });
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        gender: item.gender,
        address: item.address,
        email: item.email,
        notes: item.notes,
        phoneNumber: item.phoneNumber,
        rankId: item.rankId,
        rankName: item.Master_Rank ? item.Master_Rank?.name : "",
      }));
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const customer = await Master_Customer.findByPk(id, {
        include: [
          {
            model: Master_Rank,
            attributes: ["name"],
          },
        ],
      });

      if (!customer) {
        throwValidation(400, "Customer tidak ditemukan");
      }

      const result = {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        gender: customer.gender,
        address: customer.address,
        email: customer.email,
        notes: customer.notes,
        phoneNumber: customer.phoneNumber,
        rankId: customer.rankId,
        rankName: customer.Master_Rank ? customer.Master_Rank?.name : "",
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataCustomerService;
