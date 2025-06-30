'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Monthly_Non_Current_Assets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Monthly_Non_Current_Assets.init({
    date: DataTypes.DATEONLY,
    vehicleValue: DataTypes.BIGINT,
    buildingValue: DataTypes.BIGINT,
    buildingValue: DataTypes.BIGINT,
    landValue: DataTypes.BIGINT,
    longTermInvestment: DataTypes.BIGINT,
    othersValue: DataTypes.BIGINT,
    previousYearDepreciation: DataTypes.BIGINT,
    currentYearDepreciation: DataTypes.BIGINT,
    totalValue: DataTypes.BIGINT,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Monthly_Non_Current_Assets',
  });
  return Monthly_Non_Current_Assets;
};