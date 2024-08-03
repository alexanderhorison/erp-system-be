'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stock_Opname extends Model {

    static associate(models) {

      Stock_Opname.hasMany(models.Stock_Opname_Product, { foreignKey: "stockOpnameId" });

      Stock_Opname.belongsTo(models.Master_Warehouse, { foreignKey: "warehouseId" });

      Stock_Opname.belongsTo(models.Master_User, { foreignKey: "createdBy", as: "creator" });

      Stock_Opname.belongsTo(models.Master_User, { foreignKey: "updatedBy", as: "updater" });

      Stock_Opname.belongsTo(models.Master_User, { foreignKey: "deletedBy", as: "deleter" });
    }
  }
  Stock_Opname.init({
    code: DataTypes.STRING,
    warehouseId: DataTypes.INTEGER,
    opnameDate: DataTypes.DATE,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE,
    deletedBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Stock_Opname',
    paranoid: true,
  });
  return Stock_Opname;
};