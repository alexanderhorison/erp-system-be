"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Warehouse_Rack extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Warehouse_Rack.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      })
      Master_Warehouse_Rack.hasMany(models.Master_Warehouse_Rack_Attribute, {
        foreignKey: "warehouseRackId",
      })
      Master_Warehouse_Rack.hasOne(models.Warehouse_Product, { foreignKey: 'warehouseRackId' });
    }
  }
  Master_Warehouse_Rack.init(
    {
      warehouseId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Master_Warehouse_Rack",
    }
  );
  return Master_Warehouse_Rack;
};
