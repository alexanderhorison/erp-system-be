"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Warehouse_Rack_Attribute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Warehouse_Rack_Attribute.belongsTo(models.Master_Warehouse_Rack, {
        foreignKey: "warehouseRackId",
      });
    }
  }
  Master_Warehouse_Rack_Attribute.init(
    {
      warehouseRackId: DataTypes.INTEGER,
      key: DataTypes.STRING,
      value: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Master_Warehouse_Rack_Attribute",
      hooks: {
        beforeCreate: (rackAttribute) => {
          rackAttribute.key = rackAttribute.key.toUpperCase();
        },
        beforeUpdate: (rackAttribute) => {
          rackAttribute.key = rackAttribute.key.toUpperCase();
        },
      },
    }
  );
  return Master_Warehouse_Rack_Attribute;
};
