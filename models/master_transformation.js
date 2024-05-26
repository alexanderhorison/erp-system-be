'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Master_Transformation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Master_Transformation.belongsTo(models.Master_Product, { foreignKey: 'MasterProductId' });
      Master_Transformation.belongsTo(models.Unit, { as: "UnitFrom", foreignKey: 'UnitFromId' });
      Master_Transformation.belongsTo(models.Unit, { as: "UnitTo", foreignKey: 'UnitToId' });
      Master_Transformation.belongsTo(models.User, { foreignKey: 'createdBy' });
    }
  }
  Master_Transformation.init({
    MasterProductId: DataTypes.INTEGER,
    UnitFromId: DataTypes.INTEGER,
    amount_from: DataTypes.INTEGER,
    UnitToId: DataTypes.INTEGER,
    amount_to: DataTypes.INTEGER,
    info: DataTypes.TEXT,
    createdBy: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Master_Transformation',
  });
  return Master_Transformation;
};