"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Audit_Trail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Audit_Trail.init(
    {
      date: DataTypes.DATE,
      action: DataTypes.STRING,
      action_by: DataTypes.STRING,
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
