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

      Master_Customer.hasMany(models.Sales_Order, {
        foreignKey: "customerId",
      });

      Master_Customer.hasMany(models.Pos_Transaction, {
        foreignKey: "customerId",
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
      deletedAt: DataTypes.DATE,
      isPosCustomer: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Master_Customer",
      paranoid: true,
    }
  );
  return Master_Customer;
};
