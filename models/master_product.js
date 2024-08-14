"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Product extends Model {
    static associate(models) {
      // define association here
      Master_Product.belongsTo(models.Master_Category, {
        foreignKey: "categoryId",
      });
      Master_Product.belongsTo(models.Master_Type, { foreignKey: "typeId" });
      Master_Product.hasMany(models.Warehouse_Product, {
        foreignKey: "productId",
      });
      Master_Product.belongsTo(models.Master_Company, { foreignKey: "companyId" })
    }
  }
  Master_Product.init(
    {
      name: DataTypes.STRING,
      categoryId: DataTypes.INTEGER,
      typeId: DataTypes.INTEGER,
      image: DataTypes.TEXT,
      description: DataTypes.TEXT,
      companyId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Master_Product",
      paranoid: true,
    }
  );

  return Master_Product;

};
