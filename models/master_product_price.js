"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Master_Product_Price extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Product_Price.belongsTo(models.Master_Product, {
        foreignKey: "productId",
      });
      Master_Product_Price.belongsTo(models.Master_Unit, {
        foreignKey: "unitId",
      });
    }
  }
  Master_Product_Price.init(
    {
      productId: DataTypes.INTEGER,
      unitId: DataTypes.INTEGER,
      basePrice: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Master_Product_Price",
    }
  );
  return Master_Product_Price;
};
