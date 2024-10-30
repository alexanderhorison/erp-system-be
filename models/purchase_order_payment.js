"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Purchase_Order_Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Purchase_Order_Payment.belongsTo(models.Purchase_Order, {
        foreignKey: "purchaseOrderId",
      });
      Purchase_Order_Payment.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }
  Purchase_Order_Payment.init(
    {
      typePayment: DataTypes.STRING,
      amount: DataTypes.BIGINT,
      notes: DataTypes.TEXT,
      purchaseOrderId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Purchase_Order_Payment",
    }
  );
  return Purchase_Order_Payment;
};
