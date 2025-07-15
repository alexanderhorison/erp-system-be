'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Monthly_Longterm_Liabilities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Monthly_Longterm_Liabilities.init({
    date: DataTypes.DATEONLY,
    shareHolderLoans: DataTypes.BIGINT,
    longTermBankLoans: DataTypes.BIGINT,
    otherLongtermLiabilities: DataTypes.BIGINT,
    totalLongtermLiabilities: DataTypes.BIGINT,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Monthly_Longterm_Liabilities',
  });
  return Monthly_Longterm_Liabilities;
};