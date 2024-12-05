"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pos_Transaction_Payment_History extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pos_Transaction_Payment_History.belongsTo(models.Pos_Transaction, {
        foreignKey: "posTransactionId",
      });
      Pos_Transaction_Payment_History.belongsTo(models.Pos_Payment_Type, {
        foreignKey: "posPaymentTypeId",
      });
    }
  }
  Pos_Transaction_Payment_History.init(
    {
      posTransactionId: DataTypes.INTEGER,
      total: DataTypes.BIGINT,
      posPaymentTypeId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Pos_Transaction_Payment_History",
    }
  );
  return Pos_Transaction_Payment_History;
};
