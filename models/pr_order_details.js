'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pr_Order_Details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Pr_Order_Details.belongsTo(models.Pr_Orders, {
        foreignKey: "productRequestOrderId",
      });
      Pr_Order_Details.belongsTo(models.Master_Product, { foreignKey: "productId" });
      Pr_Order_Details.belongsTo(models.Master_Unit, { foreignKey: "unitId" });
    }
  }
  Pr_Order_Details.init({
    productRequestOrderId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER,
    quantityRequested: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Pr_Order_Details',
  });
  return Pr_Order_Details;
};