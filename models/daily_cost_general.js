'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Daily_Cost_General extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Daily_Cost_General.belongsTo(models.Daily_Cost, {
        foreignKey: "dailyCostId"
      });
      Daily_Cost_General.belongsTo(models.Sales_Order, {
        foreignKey: "salesOrderId"
      });
      Daily_Cost_General.belongsTo(models.Tm_Employee, {
        foreignKey: "driverId"
      });
      Daily_Cost_General.belongsTo(models.Tm_Cars, {
        foreignKey: "carsId"
      });
    }
  }
  Daily_Cost_General.init({
    dailyCostId: DataTypes.INTEGER,
    salesOrderId: DataTypes.INTEGER,
    depositBalance: DataTypes.BIGINT,
    driverId: DataTypes.INTEGER,
    carsId: DataTypes.INTEGER,
    eMoneyBalance: DataTypes.BIGINT,
    latestEMoneyBalance: DataTypes.BIGINT,
    remainingEMoneyBalance: DataTypes.BIGINT,
    tollCost: DataTypes.BIGINT,
    fuelCost: DataTypes.BIGINT,
    transportAllowance: DataTypes.BIGINT,
    remainingDepositBalance: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Daily_Cost_General',
  });
  return Daily_Cost_General;
};