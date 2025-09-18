const { Tm_Employee, Trx_Employee_Debt, Daily_Cost_Employee,
  sequelize: sq,
} = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { buildQueryOptions, buildPaginationResponse } = require("../../helpers/queryBuilderHelper");

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

      // Build query options using helper
      const queryOptions = buildQueryOptions(query, {
        searchFields: ['nama', 'phone', 'address', 'role'],
        additionalWhere: {
          ...(active !== undefined && { is_active: active }),
        },
        enableDate: false,
      });

      const data = await Tm_Employee.findAndCountAll({
        where: queryOptions.where,
        order: queryOptions.order.length > 0 ? queryOptions.order : [["nama", "ASC"]],
        limit: queryOptions.limit,
        offset: queryOptions.offset,
      });

      return {
        data: data.rows,
        pagination: buildPaginationResponse(data, query),
      };
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

  static async createTransaction(data, employeeId) {
    const transaction = await sq.transaction();
    try {
      const { date, type, category, amount, dailyCostEmployeeId, notes } = data;

      // Find and validate employee
      const employee = await Tm_Employee.findByPk(employeeId);
      if (!employee) {
        throwValidation(400, "Karyawan tidak ditemukan");
      }

      // If dailyCostEmployeeId is provided, validate it
      if (dailyCostEmployeeId) {
        const dailyCostEmployee = await Daily_Cost_Employee.findByPk(dailyCostEmployeeId);
        if (!dailyCostEmployee) {
          throwValidation(400, "Data daily cost tidak ditemukann");
        }
        // Verify if the dailyCostEmployee belongs to the same employee
        if (dailyCostEmployee.employeeId !== employeeId) {
          throwValidation(400, "Data daily cost tidak sesuai dengan karyawan");
        }
      }

      // Calculate new debt
      let newDebt = Number(employee.debt) || 0;
      if (type === 'PEMBAYARAN') {
        newDebt = newDebt - Number(amount);
        if (newDebt < 0) {
          throwValidation(400, `Jumlah pembayaran melebihi hutang karyawan, utang karyawan sebesar ${priceFormatWIthCurrency(employee.debt)}`);
        }
      } else if (type === 'PEMINJAMAN') {
        newDebt = newDebt + Number(amount);
      }

      // Create transaction
      const trx = await Trx_Employee_Debt.create(
        {
          date,
          type,
          category,
          amount,
          dailyCostEmployeeId,
          employeeId,
          notes
        },
        { transaction }
      );

      // Update employee debt
      await employee.update({ debt: newDebt }, { transaction });

      await transaction.commit();
      return {
        trx,
        newDebt,
        employee: {
          id: employee.id,
          nama: employee.nama,
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAllTransactions({ page = 1, pageSize = 5 }, employeeId) {
    try {
      const { count, rows } = await Trx_Employee_Debt.findAndCountAll({
        include: [
          {
            model: Daily_Cost_Employee,
            attributes: ['id', 'salary', 'bonus', 'amountDebtPaid', 'amountDebt', 'notes'],
          },
          {
            model: Tm_Employee,
          }
        ],
        where: {
          employeeId,
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [['createdAt', 'DESC']],
      });

      const result = rows.map((item) => ({
        id: item.id,
        date: item.date,
        Employee: Tm_Employee,
        Daily_Cost_Employee: item.Daily_Cost_Employee,
        type: item.type,
        category: item.category,
        amount: item.amount,
        notes: item.notes,
      }))

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

  static async deleteTransaction(id) {
    const transaction = await sq.transaction();
    try {
      const trx = await Trx_Employee_Debt.findOne({
        where: { id }
      });

      if (!trx) {
        throwValidation(400, `Transaksi hutang tidak ditemukan`);
      }

      // Find employee
      const employee = await Tm_Employee.findByPk(trx.employeeId);
      if (!employee) {
        throwValidation(400, `Karyawan tidak ditemukan`);
      }

      // Calculate new debt (reverse the transaction)
      let newDebt = Number(employee.debt) || 0;
      if (trx.type === 'PEMBAYARAN') {
        newDebt += Number(trx.amount);
      } else if (trx.type === 'PEMINJAMAN') {
        newDebt -= Number(trx.amount);
      }

      if (trx.dailyCostEmployeeId) {
        await Daily_Cost_Employee.destroy({
          where: { id: trx.dailyCostEmployeeId },
          transaction
        });
      }

      await employee.update({ debt: newDebt }, { transaction });
      await trx.destroy();
      await transaction.commit();

      return {
        id: employee.id,
        nama: employee.nama,
        debt: newDebt
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = MasterDataEmployeeService;
