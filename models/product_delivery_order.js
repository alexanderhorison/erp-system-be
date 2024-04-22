"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product_Delivery_Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product_Delivery_Order.belongsTo(models.Delivery_Order, {
        foreignKey: "delivery_order_id",
        targetKey: 'delivery_order_id',
      });
      Product_Delivery_Order.belongsTo(models.Product_Warehouse, {
        foreignKey: "ProductWarehouseId",
      });
    }
  }
  Product_Delivery_Order.init(
    {
      DeliveryOrderId: DataTypes.INTEGER,
      ProductWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      delivery_order_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Product_Delivery_Order",
      tableName: "Product_Delivery_Order", 
    }
  );
  return Product_Delivery_Order;
};
