"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Warehouse extends Model {
    static associate(models) {
      // define association here
      Master_Warehouse.hasMany(models.Master_User, { foreignKey: "warehouseId" });
      Master_Warehouse.hasMany(models.Delivery_Order, {
        foreignKey: "warehouseOriginId",
      });
      Master_Warehouse.hasMany(models.Delivery_Order, {
        foreignKey: "warehouseDestinationId",
      });
    }
  }
  Master_Warehouse.init(
    {
      name: DataTypes.STRING,
      location: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Warehouse",
      paranoid: true,
    }
  );
  return Master_Warehouse;
};
