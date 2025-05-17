"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tm_Cars extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tm_Cars.init(
    {
      name: DataTypes.STRING,
      plate_number: DataTypes.TEXT,
      description: DataTypes.TEXT,
      is_active: DataTypes.BOOLEAN,
      emoneyBalance: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Tm_Cars",
    }
  );
  return Tm_Cars;
};
