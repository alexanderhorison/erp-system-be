"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pos_Payment_Type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pos_Payment_Type.hasMany(models.Pos_Transaction_Payment_History, {
        foreignKey: "posPaymentTypeId",
      });
    }
  }
  Pos_Payment_Type.init(
    {
      code: DataTypes.STRING,
      label: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Pos_Payment_Type",
    }
  );
  return Pos_Payment_Type;
};
