'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Monthly_Shortterm_Liabilities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Monthly_Shortterm_Liabilities.init({
    date: DataTypes.DATEONLY,
    tradePayables: DataTypes.BIGINT,
    nonTradePayables: DataTypes.BIGINT,
    accruedExpenses: DataTypes.BIGINT,
    taxPayables: DataTypes.BIGINT,
    totalShortTermLiabilities: DataTypes.BIGINT,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Monthly_Shortterm_Liabilities',
  });
  return Monthly_Shortterm_Liabilities;
};