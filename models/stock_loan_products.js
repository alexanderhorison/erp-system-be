"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Stock_Loan_Products extends Model {
    static associate(models) {
      // define association here
      Stock_Loan_Products.belongsTo(models.Warehouse_Product, {
        foreignKey: "productWarehouseId",
      });
    }
  }
  Stock_Loan_Products.init(
    {
      productWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Stock_Loan_Products",
    }
  );
  return Stock_Loan_Products;
};
