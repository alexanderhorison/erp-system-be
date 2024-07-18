"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Type extends Model {
    static associate(models) {
      // define association here
    }
  }
  Master_Type.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Type",
      paranoid: true,
    }
  );

  return Master_Type;

};
