"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Vendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Vendor.belongsTo(models.Master_Rank, {
        foreignKey: "rankId",
      });

      Master_Vendor.hasMany(models.Purchase_Order, {
        foreignKey: "vendorId",
      });
    }
  }
  Master_Vendor.init(
    {
      name: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
      email: DataTypes.STRING,
      address: DataTypes.TEXT,
      gender: DataTypes.STRING,
      notes: DataTypes.TEXT,
      rankId: DataTypes.INTEGER,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Master_Vendor",
      paranoid: true,
    }
  );
  return Master_Vendor;
};
