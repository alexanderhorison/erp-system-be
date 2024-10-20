"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sales_Order_Barter_Details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sales_Order_Barter_Details.belongsTo(models.Sales_Order, {
        foreignKey: "salesOrderId",
      });

      Sales_Order_Barter_Details.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });
    }
  }
  Sales_Order_Barter_Details.init(
    {
      salesOrderId: DataTypes.INTEGER,
      warehouseProductId: DataTypes.INTEGER,
      price: DataTypes.BIGINT,
      quantity: DataTypes.INTEGER,
      subTotal: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Sales_Order_Barter_Details",
    }
  );
  return Sales_Order_Barter_Details;
};
