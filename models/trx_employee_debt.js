'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Trx_Employee_Debt extends Model {
    static associate(models) {
      Trx_Employee_Debt.belongsTo(models.Daily_Cost_Employee, {
        foreignKey: 'dailyCostEmployeeId',
      });
      Trx_Employee_Debt.belongsTo(models.Tm_Employee, {
        foreignKey: 'employeeId',
      });
    }
  }
  Trx_Employee_Debt.init({
    date: DataTypes.DATEONLY,
    type: DataTypes.STRING,
    category: DataTypes.STRING,
    amount: DataTypes.BIGINT,
    dailyCostEmployeeId: DataTypes.INTEGER,
    employeeId: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Trx_Employee_Debt',
  });
  return Trx_Employee_Debt;
};
