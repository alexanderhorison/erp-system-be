'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Adjustment_Goods_In_Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Adjustment_Goods_In_Product.belongsTo(models.Adjustment_Goods_In, {
        foreignKey: "adjustmentGoodsInId",
      });

      Adjustment_Goods_In_Product.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });

      Adjustment_Goods_In_Product.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }
  Adjustment_Goods_In_Product.init({
    adjustmentGoodsInId: DataTypes.INTEGER,
    warehouseProductId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Adjustment_Goods_In_Product',
  });
  return Adjustment_Goods_In_Product;
};