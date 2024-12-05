"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pos_Transaction_Detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pos_Transaction_Detail.belongsTo(models.Pos_Transaction, {
        foreignKey: "posTransactionId",
      });

      Pos_Transaction_Detail.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });
    }
  }
  Pos_Transaction_Detail.init(
    {
      posTransactionId: DataTypes.INTEGER,
      warehouseProductId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      price: DataTypes.BIGINT,
      quantity: DataTypes.INTEGER,
      subTotal: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Pos_Transaction_Detail",
    }
  );
  return Pos_Transaction_Detail;
};
