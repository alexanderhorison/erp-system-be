"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Stock_Adjustment_History extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stock_Adjustment_History.init(
    {
      ProductWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      adjustment_type: DataTypes.STRING,
      WarehouseId: DataTypes.INTEGER,
      UserId: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Stock_Adjustment_History",
    }
  );
  return Stock_Adjustment_History;
};
