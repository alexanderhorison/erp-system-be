const {
  Daily_Cost,
  Daily_Cost_General,
  Daily_Cost_Employee,
  Daily_Cost_Unexpected,
  sequelize,
  Tm_Cars,
  Tm_Employee,
  Tm_Unexpected_Cost_Categories,
  Sales_Order,
  Master_Customer,
} = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");
const {
  formatStartDateDatabase,
  formatEndDateDatabase,
} = require("../../helpers/formatDate");

class DailyCostService {
  static async create(data, user) {
    const transaction = await sequelize.transaction();
    try {
      const {
        date,
        notes,
        status,
        grandTotal,
        totalCostGeneral,
        totalCostEmployee,
        totalCostUnexpected,
        costGenerals = [],
        costEmployees = [],
        costUnexpecteds = [],
      } = data;

      // Check if daily cost already exists for the date
      const existingDailyCost = await Daily_Cost.findOne({
        where: {
          date: {
            [Op.between]: DailyCostService.formatDateDailyCost(date),
          },
        },
        transaction,
      });

      if (existingDailyCost) {
        await transaction.rollback();
        throw {
          code: 400,
          message: "Daily cost untuk tanggal ini sudah ada",
        };
      }

      // Create main daily cost record
      // Set the time to noon in local timezone to avoid date shift issues
      const localDate = moment(date).hours(0).minutes(0).seconds(0);

      const newDailyCost = await Daily_Cost.create(
        {
          date: localDate,
          notes,
          status: status || "DRAFT",
          grandTotal: grandTotal || 0,
          totalCostGeneral: totalCostGeneral || 0,
          totalCostEmployee: totalCostEmployee || 0,
          totalCostUnexpected: totalCostUnexpected || 0,
        },
        { transaction }
      );

      // Create related cost general records
      if (costGenerals && costGenerals.length > 0) {
        const costGeneralRecords = costGenerals.map((costGeneral) => ({
          ...costGeneral,
          dailyCostId: newDailyCost.id,
        }));
        await Daily_Cost_General.bulkCreate(costGeneralRecords, {
          transaction,
        });
      }

      // Create related cost employee records
      if (costEmployees && costEmployees.length > 0) {
        const costEmployeeRecords = costEmployees.map((costEmployee) => ({
          ...costEmployee,
          dailyCostId: newDailyCost.id,
        }));
        await Daily_Cost_Employee.bulkCreate(costEmployeeRecords, {
          transaction,
        });
      }

      // Create related cost unexpected records
      if (costUnexpecteds && costUnexpecteds.length > 0) {
        const costUnexpectedRecords = costUnexpecteds.map((costUnexpected) => ({
          ...costUnexpected,
          dailyCostId: newDailyCost.id,
        }));
        await Daily_Cost_Unexpected.bulkCreate(costUnexpectedRecords, {
          transaction,
        });
      }

      await transaction.commit();
      return newDailyCost;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(date, data, user) {
    try {
      const {
        date,
        notes,
        status,
        grandTotal,
        totalCostGeneral,
        totalCostEmployee,
        totalCostUnexpected,
        costGenerals = [],
        costEmployees = [],
        costUnexpecteds = [],
      } = data;

      const existingDailyCost = await Daily_Cost.findOne({
        where: {
          date: {
            [Op.between]: DailyCostService.formatDateDailyCost(date),
          },
        },
      });

      if (!existingDailyCost) {
        throw {
          code: 404,
          message: "Daily cost tidak ditemukan",
        };
      }

      const id = existingDailyCost?.id;

      // Set the time to noon in local timezone to avoid date shift issues
      const localDate = date
        ? moment(date).hours(12).minutes(0).seconds(0)
        : existingDailyCost.date;

      // Update main daily cost record
      const updatedDailyCost = await existingDailyCost.update({
        date: localDate,
        notes,
        status,
        grandTotal:
          grandTotal !== undefined ? grandTotal : existingDailyCost.grandTotal,
        totalCostGeneral:
          totalCostGeneral !== undefined
            ? totalCostGeneral
            : existingDailyCost.totalCostGeneral,
        totalCostEmployee:
          totalCostEmployee !== undefined
            ? totalCostEmployee
            : existingDailyCost.totalCostEmployee,
        totalCostUnexpected:
          totalCostUnexpected !== undefined
            ? totalCostUnexpected
            : existingDailyCost.totalCostUnexpected,
      });

      // Update related cost general records
      if (costGenerals && costGenerals.length > 0) {
        // Delete existing records
        await Daily_Cost_General.destroy({
          where: { dailyCostId: id },
        });

        // Create new records
        const costGeneralRecords = costGenerals.map((costGeneral) => ({
          ...costGeneral,
          dailyCostId: id,
        }));
        await Daily_Cost_General.bulkCreate(costGeneralRecords);
      }

      // Update related cost employee records
      if (costEmployees && costEmployees.length > 0) {
        // Delete existing records
        await Daily_Cost_Employee.destroy({
          where: { dailyCostId: id },
        });

        // Create new records
        const costEmployeeRecords = costEmployees.map((costEmployee) => ({
          ...costEmployee,
          dailyCostId: id,
        }));
        await Daily_Cost_Employee.bulkCreate(costEmployeeRecords);
      }

      // Update related cost unexpected records
      if (costUnexpecteds && costUnexpecteds.length > 0) {
        // Delete existing records
        await Daily_Cost_Unexpected.destroy({
          where: { dailyCostId: id },
        });

        // Create new records
        const costUnexpectedRecords = costUnexpecteds.map((costUnexpected) => ({
          ...costUnexpected,
          dailyCostId: id,
        }));
        await Daily_Cost_Unexpected.bulkCreate(costUnexpectedRecords);
      }

      return updatedDailyCost;
    } catch (error) {
      throw error;
    }
  }

  static async delete(date, user) {
    const transaction = await sequelize.transaction();
    try {
      const dailyCost = await Daily_Cost.findOne({
        where: {
          date: {
            [Op.between]: DailyCostService.formatDateDailyCost(date),
          },
        },
        include: [
          {
            model: Daily_Cost_General,
            as: "Daily_Cost_Generals",
          },
          {
            model: Daily_Cost_Employee,
            as: "Daily_Cost_Employees",
          },
          {
            model: Daily_Cost_Unexpected,
            as: "Daily_Cost_Unexpecteds",
          },
        ],
        transaction,
      });

      if (!dailyCost) {
        throw {
          code: 404,
          message: "Daily cost tidak ditemukan",
        };
      }
      
      const id = dailyCost?.id;

      // RESTORE EMONEY CARS
      // if (dailyCost?.Daily_Cost_Generals?.length > 0) {
      //   await Promise.all(
      //     dailyCost.Daily_Cost_Generals.map(async (item) => {
      //       const findCar = await Tm_Cars.findOne({
      //         where: {
      //           id: item.carsId,
      //         },
      //         transaction,
      //       });
      //       const restoreEmoney =
      //         (item.tollCost || 0) - (item.eMoneyBalance || 0);
      //       findCar.eMoneyBalance -= restoreEmoney;
      //       await findCar.save({ transaction });
      //     })
      //   );
      // }

      // Delete related records first within the transaction
      await Daily_Cost_General.destroy({
        where: { dailyCostId: id },
        transaction,
      });

      await Daily_Cost_Employee.destroy({
        where: { dailyCostId: id },
        transaction,
      });

      await Daily_Cost_Unexpected.destroy({
        where: { dailyCostId: id },
        transaction,
      });

      // Finally, delete the main record
      await dailyCost.destroy({ transaction });

      // Commit the transaction
      await transaction.commit();

      return { id };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }

  static async findAll(query) {
    try {
      const whereClause = {};

      if (query.startDate && query.endDate) {
        whereClause.date = {
          [Op.between]: [
            new Date(query.startDate).setHours(0, 0, 0, 0),
            new Date(query.endDate).setHours(23, 59, 59, 999),
          ],
        };
      } else if (query.startDate) {
        whereClause.date = {
          [Op.gte]: new Date(query.startDate).setHours(0, 0, 0, 0),
        };
      } else if (query.endDate) {
        whereClause.date = {
          [Op.lte]: new Date(query.endDate).setHours(23, 59, 59, 999),
        };
      }

      if (query.status) {
        whereClause.status = query.status;
      }

      const data = await Daily_Cost.findAll({
        where: whereClause,
        include: [
          {
            model: Daily_Cost_General,
            as: "Daily_Cost_Generals",
          },
          {
            model: Daily_Cost_Employee,
            as: "Daily_Cost_Employees",
          },
          {
            model: Daily_Cost_Unexpected,
            as: "Daily_Cost_Unexpecteds",
          },
        ],
        order: [["date", "DESC"]],
      });

      const result = data.map((item) => ({
        id: item.id,
        date: item.date,
        notes: item.notes,
        status: item.status,
        grandTotal: item.grandTotal,
        totalCostGeneral: item.totalCostGeneral,
        totalCostEmployee: item.totalCostEmployee,
        totalCostUnexpected: item.totalCostUnexpected,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        costGenerals: item.Daily_Cost_Generals || [],
        costEmployees: item.Daily_Cost_Employees || [],
        costUnexpecteds: item.Daily_Cost_Unexpecteds || [],
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findOne(date) {
    try {
      const dailyCost = await Daily_Cost.findOne({
        where: {
          date: {
            [Op.between]: DailyCostService.formatDateDailyCost(date),
          },
        },
        include: [
          {
            model: Daily_Cost_General,
            include: [
              {
                model: Sales_Order,
                include: [
                  {
                    model: Master_Customer,
                  }
                ]
              },  
              {
                model: Tm_Cars,
              },
              {
                model: Tm_Employee,
              },
            ]
          },
          {
            model: Daily_Cost_Employee,
            include: [
              {
                model: Tm_Employee,
              },
            ]
          },
          {
            model: Daily_Cost_Unexpected,
            include: [
              {
                model: Tm_Unexpected_Cost_Categories,
              },
            ]
          },
        ],
      });

      if (!dailyCost) {
        throw {
          code: 404,
          message: "Daily cost tidak ditemukan",
        };
      }

      const result = {
        id: dailyCost.id,
        date: moment(dailyCost.date).format("YYYY-MM-DD"),
        notes: dailyCost.notes,
        status: dailyCost.status,
        grandTotal: dailyCost.grandTotal,
        totalCostGeneral: dailyCost.totalCostGeneral,
        totalCostEmployee: dailyCost.totalCostEmployee,
        totalCostUnexpected: dailyCost.totalCostUnexpected,
        createdAt: dailyCost.createdAt,
        updatedAt: dailyCost.updatedAt,
        costGenerals: dailyCost.Daily_Cost_Generals || [],
        costEmployees: dailyCost.Daily_Cost_Employees || [],
        costUnexpecteds: dailyCost.Daily_Cost_Unexpecteds || [],
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findByMonth(month, year) {
    try {
      // Get first and last day of the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Set time to include all records for the start and end days
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const dailyCosts = await Daily_Cost.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: [
          "id",
          "totalCostEmployee",
          "totalCostGeneral",
          "totalCostUnexpected",
          "notes",
          "status",
          "date",
        ],
      });

      // Transform the results to include only id and calculated grandTotal
      const result = dailyCosts.map((item) => ({
        id: item.id,
        date: moment(item?.date).format("YYYY-MM-DD"),
        grandTotal:
          Number(item.totalCostEmployee || 0) +
          Number(item.totalCostGeneral || 0) +
          Number(item.totalCostUnexpected || 0),
        notes: item.notes,
        status: item.status,
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  static formatDateDailyCost(date) {
    return [
      new Date(date).setHours(0, 0, 0, 0),
      new Date(date).setHours(23, 59, 59, 999),
    ];
  }

}

module.exports = DailyCostService;
