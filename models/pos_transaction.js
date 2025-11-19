"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pos_Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pos_Transaction.belongsTo(models.Master_Customer, {
        foreignKey: "customerId",
      });
      Pos_Transaction.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Pos_Transaction.belongsTo(models.Master_User, {
        foreignKey: "updatedBy",
        as: "updater",
      });
      Pos_Transaction.belongsTo(models.Master_User, {
        foreignKey: "deletedBy",
        as: "deleter",
      });
      Pos_Transaction.hasMany(models.Pos_Transaction_Detail, {
        foreignKey: "posTransactionId",
      });
      Pos_Transaction.hasOne(models.Pos_Transaction_Payment_History, {
        foreignKey: "posTransactionId",
      });
      Pos_Transaction.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });
    }
  }
  Pos_Transaction.init(
    {
      customerId: DataTypes.INTEGER,
      code: DataTypes.STRING,
      subTotal: DataTypes.BIGINT,
      totalDiscount: DataTypes.BIGINT,
      grandTotal: DataTypes.BIGINT,
      totalPayment: DataTypes.BIGINT,
      notes: DataTypes.TEXT,
      status: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      deletedAt: DataTypes.DATE,
      deletedBy: DataTypes.INTEGER,
      warehouseId: DataTypes.INTEGER,
      totalQuantity: DataTypes.INTEGER,
      totalItems: DataTypes.INTEGER,
      lastDebt: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Pos_Transaction",
      paranoid: true,
    }
  );
  return Pos_Transaction;
};
