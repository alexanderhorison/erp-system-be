'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Daily_Cost_Unexpected extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Daily_Cost_Unexpected.belongsTo(models.Daily_Cost, {
        foreignKey: "dailyCostId"
      });
      Daily_Cost_Unexpected.belongsTo(models.Tm_Unexpected_Cost_Categories, {
        foreignKey: "categoryId"
      });
    }
  }
  Daily_Cost_Unexpected.init({
    dailyCostId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    price: DataTypes.BIGINT,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Daily_Cost_Unexpected',
  });
  return Daily_Cost_Unexpected;
};