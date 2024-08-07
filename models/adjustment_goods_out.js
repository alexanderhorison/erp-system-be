'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Adjustment_Goods_Out extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Adjustment_Goods_Out.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseOriginId",
      });

      Adjustment_Goods_Out.hasMany(models.Adjustment_Goods_Out_Product, {
        foreignKey: "adjustmentGoodsOutId",
        as: "agop",
      });

      Adjustment_Goods_Out.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });

      Adjustment_Goods_Out.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });

      Adjustment_Goods_Out.belongsTo(models.Master_User, {
        foreignKey: "deletedBy",
        as: "deleter",
      });


    }
  }
  Adjustment_Goods_Out.init({
    code: DataTypes.STRING,
    warehouseOriginId: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
    status: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    approvedAt: DataTypes.DATE,
    approvedBy: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    deletedBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Adjustment_Goods_Out',
    paranoid: true,
  });
  return Adjustment_Goods_Out;
};