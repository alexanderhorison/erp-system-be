'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Monthly_Equity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Monthly_Equity.init({
    date: DataTypes.DATEONLY,
    shareCapital: DataTypes.BIGINT,
    retainedEarningsPreviousYear: DataTypes.BIGINT,
    retainedEarningsCurrentYear: DataTypes.BIGINT,
    retainedEarningsThisMonth: DataTypes.BIGINT,
    totalEquity: DataTypes.BIGINT,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Monthly_Equity',
  });
  return Monthly_Equity;
};