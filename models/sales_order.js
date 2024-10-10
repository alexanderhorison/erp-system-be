"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sales_Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sales_Order.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });
      Sales_Order.belongsTo(models.Master_Customer, {
        foreignKey: "customerId",
      });
      Sales_Order.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Sales_Order.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });
      Sales_Order.hasMany(models.Sales_Order_Detail, {
        foreignKey: "salesOrderId",
      });
      Sales_Order.hasMany(models.Sales_Order_Payment, {
        foreignKey: "salesOrderId",
      });
    }
  }
  Sales_Order.init(
    {
      code: DataTypes.INTEGER,
      warehouseId: DataTypes.INTEGER,
      customerId: DataTypes.INTEGER,
      grandTotal: DataTypes.BIGINT,
      status: DataTypes.STRING,
      notes: DataTypes.TEXT,
      createdBy: DataTypes.INTEGER,
      approvedBy: DataTypes.INTEGER,
      approvedAt: DataTypes.DATE,
      dueDate: DataTypes.STRING,
      amountPaid: DataTypes.BIGINT,
      amountDebt: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Sales_Order",
    }
  );
  return Sales_Order;
};
