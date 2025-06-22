"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Monthly_Current_Assets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Monthly_Current_Assets.init(
    {
      period: DataTypes.STRING(7), // Format: YYYY-MM
      cashAndBank: DataTypes.BIGINT,
      accountsReceivable: DataTypes.BIGINT,
      thirdPartyReceivable: DataTypes.BIGINT,
      otherReceivables: DataTypes.BIGINT,
      inventory: DataTypes.BIGINT,
      advancePayments: DataTypes.BIGINT,
      tax: DataTypes.BIGINT,
      grandTotal: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Monthly_Current_Assets",
    }
  );
  return Monthly_Current_Assets;
};
