"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Modal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Modal.belongsTo(models.Master_Product, {
        foreignKey: "productId",
      });
      Master_Modal.belongsTo(models.Master_Unit, {
        foreignKey: "unitId",
      });
    }
  }
  Master_Modal.init(
    {
      productId: DataTypes.INTEGER,
      unitId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      amountPurchaseOrder: DataTypes.BIGINT,
      modal: DataTypes.BIGINT,
      totalPurchaseOrder: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Master_Modal",
    }
  );
  return Master_Modal;
};
