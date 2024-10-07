const { Master_Rank, Master_Vendor } = require("../../models");
const { throwValidation } = require("../../helpers/responses");

class MasterDataVendorService {
  static async create(data) {
    try {
      const { name, phoneNumber, email, address, gender, notes, rankId } = data;

      const existingVendor = await Master_Vendor.findOne({
        where: { name: name },
      });

      if (existingVendor) {
        throwValidation(400, "Nama vendor sudah ada dalam database");
      }

      return Master_Vendor.create({
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

      const existingVendor = await Master_Vendor.findByPk(id);

      if (!existingVendor) {
        throwValidation(400, "Vendor tidak ditemukan");
      }

      const findRank = await Master_Rank.findByPk(rankId);

      if (!findRank) {
        throwValidation(400, "Data rank tidak ditemukan");
      }

      const updatedVendor = await existingVendor.update({
        name: name,
        phoneNumber: phoneNumber,
        email: email,
        address: address,
        gender: gender,
        notes: notes,
        rankId: rankId,
      });

      return updatedVendor;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const vendor = await Master_Vendor.findByPk(id);

      if (!vendor) {
        throwValidation(400, "Vendor tidak ditemukan");
      }

      const deleteVendor = await Master_Vendor.destroy({
        where: { id: id },
      });

      return deleteVendor;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Vendor.findAll({
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
      const vendor = await Master_Vendor.findByPk(id, {
        include: [
          {
            model: Master_Rank,
            attributes: ["name"],
          },
        ],
      });

      if (!vendor) {
        throwValidation(400, "Vendor tidak ditemukan");
      }

      const result = {
        id: vendor.id,
        name: vendor.name,
        phoneNumber: vendor.phoneNumber,
        gender: vendor.gender,
        address: vendor.address,
        email: vendor.email,
        notes: vendor.notes,
        phoneNumber: vendor.phoneNumber,
        rankId: vendor.rankId,
        rankName: vendor.Master_Rank ? vendor.Master_Rank?.name : "",
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataVendorService;