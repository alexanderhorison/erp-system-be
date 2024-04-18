"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Warehouse.hasMany(models.User, { foreignKey: "WarehouseId" });
      Warehouse.hasMany(models.Delivery_Order, {
        foreignKey: "WarehouseOriginId",
      });
      Warehouse.hasMany(models.Delivery_Order, {
        foreignKey: "WarehouseDestinationId",
      });
    }
  }
  Warehouse.init(
    {
      name: DataTypes.STRING,
      location: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Warehouse",
      paranoid: true,
    }
  );
  return Warehouse;
};
