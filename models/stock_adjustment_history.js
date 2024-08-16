"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Stock_Adjustment_History extends Model {
    static associate(models) {
      // define association here

      Stock_Adjustment_History.belongsTo(models.Warehouse_Product, {
        foreignKey: "productWarehouseId",
      });

      Stock_Adjustment_History.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });

      Stock_Adjustment_History.belongsTo(models.Master_User, {
        foreignKey: "userId",
      });

      Stock_Adjustment_History.belongsTo(models.Delivery_Order, {
        foreignKey: "deliveryOrderId",
      });

      Stock_Adjustment_History.belongsTo(models.Adjustment_Goods_Out, {
        foreignKey: "adjustmentGoodsOutId",
      });

      Stock_Adjustment_History.belongsTo(models.Adjustment_Goods_In, {
        foreignKey: "adjustmentGoodsInId",
      });
    }
  }

  Stock_Adjustment_History.init(
    {
      productWarehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      adjustmentType: DataTypes.STRING,
      warehouseId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
      deliveryOrderId: DataTypes.STRING,
      adjustmentGoodsOutId: DataTypes.INTEGER,
      adjustmentGoodsInId: DataTypes.INTEGER,
      lastQuantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Stock_Adjustment_History",
    }
  );

  return Stock_Adjustment_History;

};
