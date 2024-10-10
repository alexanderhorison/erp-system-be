"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sales_Order_Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sales_Order_Payment.belongsTo(models.Sales_Order, {
        foreignKey: "salesOrderId",
      });
      Sales_Order_Payment.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }
  Sales_Order_Payment.init(
    {
      typePayment: DataTypes.STRING,
      amount: DataTypes.BIGINT,
      notes: DataTypes.TEXT,
      salesOrderId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sales_Order_Payment",
    }
  );
  return Sales_Order_Payment;
};
