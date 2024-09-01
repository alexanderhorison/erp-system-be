'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Delivery_Order_Receipt extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Delivery_Order_Receipt.belongsTo(models.Delivery_Order, {
        foreignKey: "deliveryOrderId",
      });
      Delivery_Order_Receipt.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Delivery_Order_Receipt.hasMany(models.Delivery_Order_Receipt_Product, {
        foreignKey: "deliveryOrderReceiptId",
      });
    }
  }
  Delivery_Order_Receipt.init({
    code: DataTypes.STRING,
    deliveryOrderId: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Delivery_Order_Receipt',
  });
  return Delivery_Order_Receipt;
};