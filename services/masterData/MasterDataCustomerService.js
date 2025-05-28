const { Master_Rank, Master_Customer } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");

class MasterDataCustomerService {
  static async create(data) {
    try {
      const {
        name,
        phoneNumber,
        email,
        address,
        gender,
        notes,
        rankId,
        isPosCustomer,
        alias,
      } = data;

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
        isPosCustomer: isPosCustomer ? true : false,
        alias: alias,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const { name, phoneNumber, email, address, gender, notes, rankId, alias } = data;

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
        alias: alias,
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

  static async findAll(query) {
    try {
      const data = await Master_Customer.findAll({
        include: [
          {
            model: Master_Rank,
            attributes: ["name"],
          },
        ],
        where: {
          ...(query.isPosCustomer && { isPosCustomer: query.isPosCustomer }),
        },
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
        isPosCustomer: item.isPosCustomer,
        alias: item.alias,
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
        alias: customer.alias,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findAllPosCustomer({ page = 1, pageSize = 10, name = "" }) {
    try {
      const { count, rows } = await Master_Customer.findAndCountAll({
        include: [
          {
            model: Master_Rank,
            attributes: ["name"],
          },
        ],
        where: {
          ...(name && { name: { [Op.iLike]: `%${name}%` } }),
          isPosCustomer: true,
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [["createdAt", "DESC"]],
      });

      const result = rows.map((item) => ({
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        isPosCustomer: item.isPosCustomer,
      }));

      return {
        data: result,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      };
    } catch (error) {
      throw error;
    }
  }

}

module.exports = MasterDataCustomerService;
