"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Master_Customer.belongsTo(models.Master_Rank, {
        foreignKey: "rankId",
      });
    }
  }
  Master_Customer.init(
    {
      name: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
      email: DataTypes.STRING,
      address: DataTypes.STRING,
      gender: DataTypes.STRING,
      notes: DataTypes.TEXT,
      rankId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Master_Customer",
      paranoid: true,
    }
  );
  return Master_Customer;
};
