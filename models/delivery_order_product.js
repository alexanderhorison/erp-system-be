"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Delivery_Order_Product extends Model {
    static associate(models) {
      // define association here
      Delivery_Order_Product.belongsTo(models.Delivery_Order, {
        foreignKey: "deliveryOrderId",
      });

      Delivery_Order_Product.belongsTo(models.Warehouse_Product, {
        foreignKey: "productWarehouseId",
      });

    }
  }

  Delivery_Order_Product.init(
    {
      productWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      deliveryOrderId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Delivery_Order_Product",
    }
  );

  return Delivery_Order_Product;

};
