'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Delivery_Order_Receipt_Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Delivery_Order_Receipt_Product.belongsTo(models.Delivery_Order_Receipt, {
        foreignKey: "deliveryOrderReceiptId",
      });
      Delivery_Order_Receipt_Product.belongsTo(models.Delivery_Order_Product, {
        foreignKey: "deliveryOrderProductId",
      });
    }
  }
  Delivery_Order_Receipt_Product.init({
    deliveryOrderReceiptId: DataTypes.INTEGER,
    deliveryOrderProductId: DataTypes.INTEGER,
    receiveQuantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Delivery_Order_Receipt_Product',
  });
  return Delivery_Order_Receipt_Product;
};