"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Stock_Loan_History extends Model {
    static associate(models) {
      // associations
      Stock_Loan_History.belongsTo(models.Warehouse_Product, {
        foreignKey: "productWarehouseId",
      });

      Stock_Loan_History.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });

      Stock_Loan_History.belongsTo(models.Master_User, {
        foreignKey: "userId",
      });

      Stock_Loan_History.belongsTo(models.Sales_Order, {
        foreignKey: "salesOrderId",
      });
    }
  }

  Stock_Loan_History.init(
    {
      productWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      adjustmentType: DataTypes.ENUM("PLUS", "MINUS", "INITIATE"),
      warehouseId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
      salesOrderId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Stock_Loan_History",
    }
  );

  return Stock_Loan_History;

};
