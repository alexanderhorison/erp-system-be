'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pr_Orders extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pr_Orders.belongsTo(models.Master_User, {
        foreignKey: "createdBy",
        as: "creator",
      });
      Pr_Orders.belongsTo(models.Master_User, {
        foreignKey: "approvedBy",
        as: "approver",
      });
    }
  }
  Pr_Orders.init({
    code: DataTypes.STRING,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    createdBy: DataTypes.INTEGER,
    approvedBy: DataTypes.INTEGER,
    approvedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Pr_Orders',
  });
  return Pr_Orders;
};