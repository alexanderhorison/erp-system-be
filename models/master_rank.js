"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Rank extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Rank.hasMany(models.Master_Customer, { foreignKey: "rankId" });
    }
  }
  Master_Rank.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      level: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Master_Rank",
      paranoid: true,
    }
  );
  return Master_Rank;
};
