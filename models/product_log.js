"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Product_Log extends Model {
    static associate(models) {
      // define association here
    }
  }

  Product_Log.init(
    {
      name: DataTypes.STRING,
      dataBefore: DataTypes.TEXT,
      dataAfter: DataTypes.TEXT,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Product_Log",
    }
  );

  return Product_Log;

};
