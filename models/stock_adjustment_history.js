"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Stock_Adjustment_History extends Model {
    static associate(models) {
      // define association here
    }
  }

  Stock_Adjustment_History.init(
    {
      productWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      adjustmentType: DataTypes.STRING,
      warehouseId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
      deliveryOrderId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Stock_Adjustment_History",
    }
  );

  return Stock_Adjustment_History;

};
