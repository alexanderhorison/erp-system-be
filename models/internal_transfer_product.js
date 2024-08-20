"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Internal_Transfer_Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Internal_Transfer_Product.belongsTo(models.Internal_Transfer, {
        foreignKey: "internalTransferId",
      });

      Internal_Transfer_Product.belongsTo(models.Warehouse_Product, {
        foreignKey: "warehouseProductId",
      });

      Internal_Transfer_Product.belongsTo(models.Master_Warehouse_Rack, {
        foreignKey: "warehouseRackFromId",
        as: "warehouseRackOrigin",
      });

      Internal_Transfer_Product.belongsTo(models.Master_Warehouse_Rack, {
        foreignKey: "warehouseRackToId",
        as: "warehouseRackDestination",
      });
    }
  }
  Internal_Transfer_Product.init(
    {
      internalTransferId: DataTypes.INTEGER,
      warehouseProductId: DataTypes.INTEGER,
      warehouseRackFromId: DataTypes.INTEGER,
      warehouseRackToId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Internal_Transfer_Product",
    }
  );
  return Internal_Transfer_Product;
};
