"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Term_Of_Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Term_Of_Payment.belongsTo(models.Purchase_Order, {
        foreignKey: "purchaseOrderId",
      });
    }
  }
  Term_Of_Payment.init(
    {
      title: DataTypes.STRING,
      purchaseOrderId: DataTypes.INTEGER,
      dueDate: DataTypes.DATE,
      reminderDate: DataTypes.INTEGER,
      isSendEmail: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Term_Of_Payment",
    }
  );
  return Term_Of_Payment;
};
