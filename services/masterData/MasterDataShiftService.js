const { throwValidation } = require("../../helpers/responses");
const { Master_Shift, Pos_User_Shift } = require("../../models");

class MasterDataShiftService {
  static async create(data, user) {
    try {
      const { name, startShift, endShift } = data;

      const existingMasterShift = await Master_Shift.findOne({
        where: { name: name.trim() },
      });

      if (existingMasterShift) {
        throwValidation(400, "Nama shift sudah ada dalam database");
      }

      return Master_Shift.create({
        name: name,
        startShift: startShift,
        endShift: endShift,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, startShift, endShift } = data;

      const existingMasterShift = await Master_Shift.findByPk(id);

      if (!existingMasterShift) {
        throwValidation(400, "Shift tidak ditemukan");
      }

      // Check if name is being changed and if the new name already exists
      if (name !== existingMasterShift.name) {
        const duplicateName = await Master_Shift.findOne({
          where: { name: name },
        });

        if (duplicateName) {
          throwValidation(400, "Nama shift sudah ada dalam database");
        }
      }

      const updatedShift = await existingMasterShift.update({
        name: name.trim(),
        startShift: startShift,
        endShift: endShift,
      });

      return updatedShift;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const shift = await Master_Shift.findByPk(id);

      if (!shift) {
        throwValidation(400, "Shift tidak ditemukan");
      }

      // Check if there are user shifts using this master shift
      const existingUserShift = await Pos_User_Shift.findOne({
        where: { masterShiftId: id },
      });

      if (existingUserShift) {
        throwValidation(400, "Tidak bisa menghapus shift, karena ada user shift yang menggunakan shift ini");
      }

      const deleteShift = await Master_Shift.destroy({
        where: { id: id },
      });

      return deleteShift;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const data = await Master_Shift.findAll({
        order: [["name", "ASC"]],
      });
      
      const result = data.map((item) => ({
        id: item.id,
        name: item.name,
        startShift: item.startShift,
        endShift: item.endShift,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const data = await Master_Shift.findByPk(id);

      if (!data) {
        throwValidation(400, "Shift tidak ditemukan");
      }

      const result = {
        id: data.id,
        name: data.name,
        startShift: data.startShift,
        endShift: data.endShift,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataShiftService;