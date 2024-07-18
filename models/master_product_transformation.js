'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class Master_Product_Transformation extends Model {
    static associate(models) {
      // define association here
      Master_Product_Transformation.belongsTo(models.Master_Product, { foreignKey: 'masterProductId' });

      Master_Product_Transformation.belongsTo(models.Master_Unit, { as: "unitFrom", foreignKey: 'unitFromId' });

      Master_Product_Transformation.belongsTo(models.Master_Unit, { as: "unitTo", foreignKey: 'unitToId' });

      Master_Product_Transformation.belongsTo(models.Master_User, { foreignKey: 'createdBy' });
    }
  }

  Master_Product_Transformation.init({
    masterProductId: DataTypes.INTEGER,
    unitFromId: DataTypes.INTEGER,
    amountFrom: DataTypes.INTEGER,
    unitToId: DataTypes.INTEGER,
    amountTo: DataTypes.INTEGER,
    info: DataTypes.TEXT,
    createdBy: DataTypes.INTEGER,
    productTransformationId: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Master_Product_Transformation',
  });

  return Master_Product_Transformation;

};