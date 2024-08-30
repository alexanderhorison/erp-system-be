'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stock_Opname_Product extends Model {

    static associate(models) {
      // define association here

      Stock_Opname_Product.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });

      Stock_Opname_Product.belongsTo(models.Stock_Opname, {
        foreignKey: "stockOpnameId",
      });

    }
  }
  Stock_Opname_Product.init({
    stockOpnameId: DataTypes.INTEGER,
    warehouseProductId: DataTypes.INTEGER,
    systemStock: DataTypes.INTEGER,
    actualStock: DataTypes.INTEGER,
    diff: DataTypes.INTEGER,
    isAdjustment: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Stock_Opname_Product',
  });
  return Stock_Opname_Product;
};