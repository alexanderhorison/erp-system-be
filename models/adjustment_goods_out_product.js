'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Adjustment_Goods_Out_Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Adjustment_Goods_Out_Product.belongsTo(models.Adjustment_Goods_Out, {
        foreignKey: "adjustmentGoodsOutId",
      });

      Adjustment_Goods_Out_Product.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });

      Adjustment_Goods_Out_Product.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }
  Adjustment_Goods_Out_Product.init({
    adjustmentGoodsOutId: DataTypes.STRING,
    warehouseProductId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Adjustment_Goods_Out_Product',
  });
  return Adjustment_Goods_Out_Product;
};