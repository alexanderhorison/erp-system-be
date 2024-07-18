"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Category extends Model {
    static associate(models) {
      // define association here
    }
  }

  Master_Category.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Category",
      paranoid: true,
    }
  );

  return Master_Category;

};
