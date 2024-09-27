"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sales_Order_Detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sales_Order_Detail.belongsTo(models.Sales_Order, {
        foreignKey: "salesOrderId",
      });

      Sales_Order_Detail.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });
    }
  }
  Sales_Order_Detail.init(
    {
      salesOrderId: DataTypes.INTEGER,
      warehouseProductId: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      subTotal: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sales_Order_Detail",
    }
  );
  return Sales_Order_Detail;
};
