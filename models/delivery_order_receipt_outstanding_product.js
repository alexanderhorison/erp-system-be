"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Delivery_Order_Receipt_Outstanding_Product extends Model {
    static associate(models) {
      Delivery_Order_Receipt_Outstanding_Product.belongsTo(
        models.Delivery_Order_Receipt_Outstanding,
        {
          foreignKey: "deliveryOrderReceiptOutstandingId",
        }
      );
      Delivery_Order_Receipt_Outstanding_Product.belongsTo(
        models.Delivery_Order_Product,
        {
          foreignKey: "deliveryOrderProductId",
        }
      );
      Delivery_Order_Receipt_Outstanding_Product.belongsTo(
        models.Warehouse_Product,
        {
          foreignKey: "productWarehouseId",
        }
      );
    }
  }
  Delivery_Order_Receipt_Outstanding_Product.init(
    {
      deliveryOrderReceiptOutstandingId: DataTypes.INTEGER,
      deliveryOrderProductId: DataTypes.INTEGER,
      outstandingQuantity: DataTypes.INTEGER,
      status: DataTypes.STRING,
      productWarehouseId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Delivery_Order_Receipt_Outstanding_Product",
    }
  );
  return Delivery_Order_Receipt_Outstanding_Product;
};
