"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Delivery_Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Delivery_Order.belongsTo(models.Warehouse, {
        as: "WarehouseOrigin",
        foreignKey: "WarehouseOriginId",
      });
      Delivery_Order.belongsTo(models.Warehouse, {
        as: "WarehouseDestination",
        foreignKey: "WarehouseDestinationId",
      });
      Delivery_Order.hasMany(models.Product_Delivery_Order, {
        foreignKey: "delivery_order_id",
        sourceKey: "delivery_order_id",
      });
      Delivery_Order.belongsTo(models.User, { foreignKey: "createdBy" });
    }
  }
  Delivery_Order.init(
    {
      status: DataTypes.STRING,
      WarehouseOriginId: DataTypes.INTEGER,
      WarehouseDestinationId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      notes: DataTypes.TEXT,
      delivery_order_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Delivery_Order",
    }
  );
  return Delivery_Order;
};
