"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Unit extends Model {
    static associate(models) {
      // define association here
      Master_Unit.hasMany(models.Master_Product_Transformation, { foreignKey: "unitFromId" });
      Master_Unit.hasMany(models.Master_Product_Transformation, { foreignKey: "unitToId" });
    }
  }

  Master_Unit.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Unit",
      paranoid: true,
    }
  );

  return Master_Unit;

};
