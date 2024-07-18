"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Company extends Model {
    static associate(models) {
      // define association here
    }
  }

  Master_Company.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Company",
    }
  );

  return Master_Company;

};
