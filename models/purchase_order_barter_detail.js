"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Purchase_Order_Barter_Detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Purchase_Order_Barter_Detail.belongsTo(models.Purchase_Order, {
        foreignKey: "purchaseOrderId",
      });

      Purchase_Order_Barter_Detail.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });
    }
  }
  Purchase_Order_Barter_Detail.init(
    {
      purchaseOrderId: DataTypes.INTEGER,
      warehouseProductId: DataTypes.INTEGER,
      price: DataTypes.BIGINT,
      quantity: DataTypes.INTEGER,
      subTotal: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Purchase_Order_Barter_Detail",
    }
  );
  return Purchase_Order_Barter_Detail;
};
