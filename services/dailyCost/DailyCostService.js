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

      // UPDATE EMONEY CARS
      if (costGenerals && costGenerals.length > 0) {
        for (const item of costGenerals) {
          const findCar = await Tm_Cars.findOne({
            where: {
              id: item.carsId,
            },
            transaction,
          });
          if (findCar) {
            const balanceEMoney = +findCar.emoneyBalance || 0;
            const updateEmoneyCar =
              balanceEMoney -
              (item?.tollCost || 0) +
              (item?.eMoneyBalance || 0);
            findCar.emoneyBalance = updateEmoneyCar;
            await findCar.save({ transaction });
          }
        }
      }

      await transaction.commit();
      return newDailyCost;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async update(date, data, user) {
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

      const existingDailyCost = await Daily_Cost.findOne({
        where: {
          date: {
            [Op.between]: DailyCostService.formatDateDailyCost(date),
          },
        },
        include: [
          {
            model: Daily_Cost_General,
          },
          {
            model: Daily_Cost_Employee,
          },
          {
            model: Daily_Cost_Unexpected,
          },
        ],
      });

      if (!existingDailyCost) {
        await transaction.rollback();
        throw {
          code: 404,
          message: "Daily cost tidak ditemukan",
        };
      }

      const id = existingDailyCost?.id;

      const localDate = date
        ? moment(date).hours(12).minutes(0).seconds(0)
        : existingDailyCost.date;

      const updatedDailyCost = await existingDailyCost.update(
        {
          date: localDate,
          notes,
          status,
          grandTotal:
            grandTotal !== undefined
              ? grandTotal
              : existingDailyCost.grandTotal,
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
        },
        { transaction }
      );

      // UPDATE GENERAL COST
      await Daily_Cost_General.destroy({
        where: { dailyCostId: id },
        transaction,
      });
      const costGeneralRecords = costGenerals.map((costGeneral) => ({
        ...costGeneral,
        dailyCostId: id,
      }));
      await Daily_Cost_General.bulkCreate(costGeneralRecords, {
        transaction,
      });

      // UPDATE EMONEY CARS
      // Restore previous eMoney balance
      const previousCostGenerals = existingDailyCost.Daily_Cost_Generals || [];
      for (const item of previousCostGenerals) {
        const findCar = await Tm_Cars.findOne({
          where: {
            id: item.carsId,
          },
          transaction,
        });
        // Kalau update, maka tollcost - eMoneyBalance
        if (findCar) {
          const balanceEMoney = +findCar.emoneyBalance || 0;
          const restoreEmoney =
            (item.tollCost || 0) - (item.eMoneyBalance || 0);
          findCar.emoneyBalance = balanceEMoney + restoreEmoney;
          await findCar.save({ transaction });
        }
      }

      for (const item of costGenerals) {
        const findCar = await Tm_Cars.findOne({
          where: {
            id: item.carsId,
          },
          transaction,
        });

        if (findCar) {
          const balanceEMoney = +findCar.emoneyBalance || 0;
          const updateEmoneyCar =
            balanceEMoney - (item?.tollCost || 0) - (item?.eMoneyBalance || 0);
          findCar.emoneyBalance = updateEmoneyCar;
          await findCar.save({ transaction });
        }
      }

      // UPDATE EMPLOYEE COST
      await Daily_Cost_Employee.destroy({
        where: { dailyCostId: id },
        transaction,
      });
      const costEmployeeRecords = costEmployees.map((costEmployee) => ({
        ...costEmployee,
        dailyCostId: id,
      }));
      await Daily_Cost_Employee.bulkCreate(costEmployeeRecords, {
        transaction,
      });

      // UPDATE UNEXPECTED COST
      await Daily_Cost_Unexpected.destroy({
        where: { dailyCostId: id },
        transaction,
      });
      const costUnexpectedRecords = costUnexpecteds.map((costUnexpected) => ({
        ...costUnexpected,
        dailyCostId: id,
      }));
      await Daily_Cost_Unexpected.bulkCreate(costUnexpectedRecords, {
        transaction,
      });

      // throw new Error("test");
      await transaction.commit();
      return updatedDailyCost;
    } catch (error) {
      await transaction.rollback();
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
          },
          {
            model: Daily_Cost_Employee,
          },
          {
            model: Daily_Cost_Unexpected,
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

      // UPDATE EMONEY CARS
      // Restore previous eMoney balance
      const previousCostGenerals = dailyCost.Daily_Cost_Generals || [];
      for (const item of previousCostGenerals) {
        const findCar = await Tm_Cars.findOne({
          where: {
            id: item.carsId,
          },
          transaction,
        });
        // Kalau update, maka tollcost - eMoneyBalance
        if (findCar) {
          const balanceEMoney = +findCar.emoneyBalance || 0;
          const restoreEmoney =
            (item.tollCost || 0) - (item.eMoneyBalance || 0);
          findCar.emoneyBalance = balanceEMoney + restoreEmoney;
          await findCar.save({ transaction });
        }
      }

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
      let orderBy = query.orderBy.toUpperCase() === "ASC" ? "ASC" : "DESC";

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
        order: [["date", orderBy]],
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
                  },
                ],
              },
              {
                model: Tm_Cars,
              },
              {
                model: Tm_Employee,
              },
            ],
          },
          {
            model: Daily_Cost_Employee,
            include: [
              {
                model: Tm_Employee,
              },
            ],
          },
          {
            model: Daily_Cost_Unexpected,
            include: [
              {
                model: Tm_Unexpected_Cost_Categories,
              },
            ],
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

  static async findByMonth({
    date
  }) {
    try {
      const dateStart = moment(date).startOf("month");
      const dateEnd = moment(date).endOf("month");

      // Fetch all daily costs for the month
      console.log(dateStart);

      const dailyCosts = await Daily_Cost.findAll({
        where: {
          date: {
            [Op.between]: [
              dateStart,
              dateEnd,
            ],
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

      // Fetch all approved Sales Orders for the month
      const salesOrders = await Sales_Order.findAll({
        where: {
          status: "APPROVED",
          approvedAt: {
            [Op.between]: [
              dateStart,
              dateEnd,
            ],
          },
        },
        attributes: ["id", "approvedAt"],
      });

      // Group sales orders by date
      const salesOrdersByDate = {};
      salesOrders.forEach((so) => {
        const dateKey = moment(so.approvedAt).format("YYYY-MM-DD");
        if (!salesOrdersByDate[dateKey]) {
          salesOrdersByDate[dateKey] = 0;
        }
        salesOrdersByDate[dateKey] += 1;
      });

      // Create result array for all daily costs
      const result = [];

      // First add all daily costs to the result
      dailyCosts.forEach(dailyCost => {
        const dateString = moment(dailyCost.date).format("YYYY-MM-DD");
        result.push({
          id: dailyCost.id,
          date: dateString,
          grandTotal:
            Number(dailyCost.totalCostEmployee || 0) +
            Number(dailyCost.totalCostGeneral || 0) +
            Number(dailyCost.totalCostUnexpected || 0),
          notes: dailyCost.notes,
          status: dailyCost.status,
          totalSo: salesOrdersByDate[dateString] || 0,
        });
      });

      // Then add any dates with sales orders but no daily costs
      for (const dateString in salesOrdersByDate) {
        const alreadyAdded = result.some(item => item.date === dateString);

        if (!alreadyAdded) {
          result.push({
            id: null,
            date: dateString,
            grandTotal: null,
            notes: null,
            status: "EMPTY",
            totalSo: salesOrdersByDate[dateString],
          });
        }
      }

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

  static formatQueryBetweenDateDc(date1, date2) {
    return [
      new Date(date1).setHours(0, 0, 0, 0),
      new Date(date2).setHours(23, 59, 59, 999),
    ];
  }


}

module.exports = DailyCostService;
