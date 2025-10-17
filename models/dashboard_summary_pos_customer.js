'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dashboard_Summary_Pos_Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Dashboard_Summary_Pos_Customer.belongsTo(models.Master_Customer, {
        foreignKey: "customerId",
      });
    }
  }
  Dashboard_Summary_Pos_Customer.init({
    customerId: DataTypes.INTEGER,
    totalPos: DataTypes.INTEGER,
    totalAmountPos: DataTypes.BIGINT,
    totalAmountPaidPos: DataTypes.BIGINT,
    totalAmountDebtPos: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Dashboard_Summary_Pos_Customer',
  });
  return Dashboard_Summary_Pos_Customer;
};