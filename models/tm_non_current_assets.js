'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tm_Non_Current_Assets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tm_Non_Current_Assets.init({
    name: DataTypes.STRING,
    assetValue: DataTypes.BIGINT,
    assetType: DataTypes.STRING,
    isDepreciable: DataTypes.BOOLEAN,
    acquisitionDate: DataTypes.DATEONLY,
    depreciationMonths: DataTypes.INTEGER,
    depreciationValue: DataTypes.BIGINT,
    notes: DataTypes.TEXT,
    depreciationActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Tm_Non_Current_Assets',
  });
  return Tm_Non_Current_Assets;
};