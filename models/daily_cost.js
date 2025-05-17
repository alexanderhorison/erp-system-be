'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Daily_Cost extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Daily_Cost.hasMany(models.Daily_Cost_General, {
        foreignKey: "dailyCostId"
      });
      Daily_Cost.hasMany(models.Daily_Cost_Employee, {
        foreignKey: "dailyCostId"
      });
      Daily_Cost.hasMany(models.Daily_Cost_Unexpected, {
        foreignKey: "dailyCostId"
      });
    }
  }
  Daily_Cost.init({
    date: DataTypes.DATE,
    grandTotal: DataTypes.BIGINT,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    totalCostGeneral: DataTypes.BIGINT,
    totalCostEmployee: DataTypes.BIGINT,
    totalCostUnexpected: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Daily_Cost',
  });
  return Daily_Cost;
};