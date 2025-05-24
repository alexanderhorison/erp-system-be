'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Daily_Cost_Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Daily_Cost_Employee.belongsTo(models.Daily_Cost, {
        foreignKey: "dailyCostId"
      });
      Daily_Cost_Employee.belongsTo(models.Tm_Employee, {
        foreignKey: "employeeId"
      });
    }
  }
  Daily_Cost_Employee.init({
    dailyCostId: DataTypes.INTEGER,
    employeeId: DataTypes.INTEGER,
    employeeName: DataTypes.STRING,
    salary: DataTypes.INTEGER,
    bonus: DataTypes.INTEGER,
    amountDebtPaid: DataTypes.BIGINT,
    amountDebt: DataTypes.BIGINT,
    notes: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Daily_Cost_Employee',
  });
  return Daily_Cost_Employee;
};