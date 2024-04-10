"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product_Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product_Warehouse.belongsTo(models.Master_Product, {
        foreignKey: "ProductId",
      });
      Product_Warehouse.belongsTo(models.Unit);
      Product_Warehouse.belongsTo(models.Warehouse);
    }
  }
  Product_Warehouse.init(
    {
      ProductId: DataTypes.INTEGER,
      WarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      UnitId: DataTypes.INTEGER,
      minimum_stock: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Product_Warehouse",
    }
  );
  return Product_Warehouse;
};
