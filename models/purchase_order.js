"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Purchase_Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Purchase_Order.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });
      Purchase_Order.belongsTo(models.Master_Vendor, {
        foreignKey: "vendorId",
      });
      Purchase_Order.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Purchase_Order.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });
      Purchase_Order.hasMany(models.Purchase_Order_Detail, {
        foreignKey: "purchaseOrderId",
      });
      Purchase_Order.hasMany(models.Purchase_Order_Payment, {
        foreignKey: "purchaseOrderId",
      });
      Purchase_Order.hasMany(models.Purchase_Order_Barter_Detail, {
        foreignKey: "purchaseOrderId",
      });
    }
  }
  Purchase_Order.init(
    {
      code: DataTypes.STRING,
      warehouseId: DataTypes.INTEGER,
      vendorId: DataTypes.INTEGER,
      grandTotal: DataTypes.BIGINT,
      amountPaid: DataTypes.BIGINT,
      amountDebt: DataTypes.BIGINT,
      grandTotalBarter: DataTypes.BIGINT,
      grandTotalVendor: DataTypes.BIGINT,
      status: DataTypes.STRING,
      notes: DataTypes.TEXT,
      createdBy: DataTypes.INTEGER,
      approvedBy: DataTypes.INTEGER,
      approvedAt: DataTypes.DATE,
      dueDate: DataTypes.STRING,
      totalModal: DataTypes.BIGINT,
      totalGainLoss: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Purchase_Order",
    }
  );
  return Purchase_Order;
};
