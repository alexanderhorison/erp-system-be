"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Warehouse_Product extends Model {
    static associate(models) {
      // define association here
      Warehouse_Product.belongsTo(models.Master_Product, {
        foreignKey: "productId",
      });
      Warehouse_Product.belongsTo(models.Master_Unit, { foreignKey: "unitId" });
      Warehouse_Product.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });
      Warehouse_Product.hasMany(models.Delivery_Order_Product, {
        foreignKey: "productWarehouseId",
      });
      Warehouse_Product.belongsTo(models.Master_Warehouse_Rack, {
        foreignKey: "warehouseRackId",
      });
      Warehouse_Product.belongsTo(models.Master_Warehouse_Rack, {
        foreignKey: "warehouseRackId",
        as: "mwr",
      });
      Warehouse_Product.hasMany(
        models.Delivery_Order_Receipt_Outstanding_Product,
        {
          foreignKey: "productWarehouseId",
        }
      );
      // FOR DASHBOARD
      Warehouse_Product.hasMany(
        models.Stock_Adjustment_History,
        {
          foreignKey: "productWarehouseId",
        }
      );
      Warehouse_Product.hasMany(
        models.Delivery_Order_Receipt_Outstanding_Product,
        {
          foreignKey: "productWarehouseId",
          as: "productOutstanding",
        }
      );
      Warehouse_Product.belongsTo(models.Master_User, { foreignKey: "deletedBy", as: "deleter" });
      Warehouse_Product.belongsTo(models.Master_User, { foreignKey: "restoredBy", as: "restorer" });

    }
  }
  Warehouse_Product.init(
    {
      productId: DataTypes.INTEGER,
      warehouseId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      unitId: DataTypes.INTEGER,
      minimumStock: DataTypes.INTEGER,
      description: DataTypes.STRING,
      info: DataTypes.TEXT,
      warehouseRackId: DataTypes.INTEGER,
      deletedAt: DataTypes.DATE,
      deletedBy: DataTypes.INTEGER,
      restoredAt: DataTypes.DATE,
      restoredBy: DataTypes.INTEGER,
      isFavorite: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Warehouse_Product",
      paranoid: true,
    }
  );
  return Warehouse_Product;
};
