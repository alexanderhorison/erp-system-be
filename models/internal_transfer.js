"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Internal_Transfer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Internal_Transfer.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });

      Internal_Transfer.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });

      Internal_Transfer.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });

      Internal_Transfer.hasMany(models.Internal_Transfer_Product, {
        foreignKey: "internalTransferId",
      });
    }
  }
  Internal_Transfer.init(
    {
      code: DataTypes.STRING,
      warehouseId: DataTypes.INTEGER,
      status: DataTypes.STRING,
      notes: DataTypes.TEXT,
      createdBy: DataTypes.INTEGER,
      approvedBy: DataTypes.INTEGER,
      approvedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Internal_Transfer",
    }
  );
  return Internal_Transfer;
};
