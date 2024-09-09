'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Delivery_Order_Receipt_Outstanding extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Delivery_Order_Receipt_Outstanding.belongsTo(models.Delivery_Order_Receipt, {
        foreignKey: "deliveryOrderReceiptId",
      });
      Delivery_Order_Receipt_Outstanding.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Delivery_Order_Receipt_Outstanding.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });
      Delivery_Order_Receipt_Outstanding.hasMany(models.Delivery_Order_Receipt_Outstanding_Product, {
        foreignKey: "deliveryOrderReceiptOutstandingId",
        as: "productOutstandings",
      });
    }
  }
  Delivery_Order_Receipt_Outstanding.init({
    code: DataTypes.STRING,
    deliveryOrderReceiptId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    approvedBy: DataTypes.INTEGER,
    approvedAt: DataTypes.DATE,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Delivery_Order_Receipt_Outstanding',
  });
  return Delivery_Order_Receipt_Outstanding;
};