"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Dashboard_Summary_Vendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Dashboard_Summary_Vendor.belongsTo(models.Master_Vendor, {
        foreignKey: "vendorId",
      });
    }
  }
  Dashboard_Summary_Vendor.init(
    {
      vendorId: DataTypes.INTEGER,
      totalPurchaseOrder: DataTypes.INTEGER,
      totalAmountPurchaseOrder: DataTypes.BIGINT,
      totalAmountPaidPurchaseOrder: DataTypes.BIGINT,
      totalAmountDebtPurchaseOrder: DataTypes.BIGINT,
      totalAmountBarterPurchaseOrder: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Dashboard_Summary_Vendor",
    }
  );
  return Dashboard_Summary_Vendor;
};
