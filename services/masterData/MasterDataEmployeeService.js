const { Tm_Employee } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");

class MasterDataEmployeeService {
  static async create(data) {
    try {
      const {
        nama,
        phone,
        address,
        dob,
        sex,
        role,
        status,
        salary,
        bonus,
        is_active,
      } = data;

      const existingEmployee = await Tm_Employee.findOne({
        where: {
          nama: nama,
        },
      });

      if (existingEmployee) {
        throw {
          code: 400,
          message:
            "Karyawan dengan nama ini sudah ada dalam database",
        };
      }

      return Tm_Employee.create({
        nama,
        phone,
        address,
        dob,
        sex,
        role,
        status,
        salary,
        bonus,
        is_active: is_active !== undefined ? is_active : true,
      });
    } catch (error) {
      console.log(error);
      
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const employee = await Tm_Employee.findByPk(id);

      if (!employee) {
        throwValidation(400, "Karyawan tidak ditemukan");
      }

      await employee.update(data);

      return employee;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const employee = await Tm_Employee.findByPk(id);

      if (!employee) {
        throwValidation(400, "Karyawan tidak ditemukan");
      }

      // Change is_active to false instead of deleting the record
      await employee.update({ is_active: false });

      return employee;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(query) {
    try {
      const { active } = query;

      return await Tm_Employee.findAll({
        where: {
          ...(active !== undefined && { is_active: active }),
        },
        order: [["nama", "ASC"]],
      });
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const employee = await Tm_Employee.findByPk(id);

      if (!employee) {
        throwValidation(400, "Karyawan tidak ditemukan");
      }

      return employee;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataEmployeeService;
