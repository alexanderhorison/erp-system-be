"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Audit_Trail extends Model {
    static associate(models) {
      // define association here
    }
  }

  Audit_Trail.init(
    {
      date: DataTypes.DATE,
      action: DataTypes.STRING,
      actionBy: DataTypes.STRING,
      status: DataTypes.STRING,
      request: DataTypes.TEXT,
      error: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Audit_Trail",
    }
  );

  return Audit_Trail;

};
