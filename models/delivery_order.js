"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Delivery_Order extends Model {

    static associate(models) {
      // define association here
      Delivery_Order.belongsTo(models.Master_Warehouse, {
        as: "warehouseOrigin",
        foreignKey: "warehouseOriginId",
      });

      Delivery_Order.belongsTo(models.Master_Warehouse, {
        as: "warehouseDestination",
        foreignKey: "warehouseDestinationId",
      });

      Delivery_Order.hasMany(models.Delivery_Order_Product, {
        foreignKey: "deliveryOrderId",
      });

      Delivery_Order.belongsTo(models.Master_User, { foreignKey: "createdBy", as: "creatorBy" });

      Delivery_Order.belongsTo(models.Master_User, { foreignKey: "receivedBy", as: "receiverBy" });
    }
  }

  Delivery_Order.init(
    {
      status: DataTypes.STRING,
      warehouseOriginId: DataTypes.INTEGER,
      warehouseDestinationId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      notes: DataTypes.TEXT,
      code: DataTypes.STRING,
      receivedAt: DataTypes.DATE,
      receivedBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Delivery_Order",
    }
  );

  return Delivery_Order;

};
