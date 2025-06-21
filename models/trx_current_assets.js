"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Trx_Current_Assets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Trx_Current_Assets.init(
    {
      date: DataTypes.DATEONLY,
      kasAndBank: DataTypes.BIGINT,
      piutangUsaha: DataTypes.BIGINT,
      pihakKetiga: DataTypes.BIGINT,
      piutangLain: DataTypes.BIGINT,
      persediaan: DataTypes.BIGINT,
      uangMuka: DataTypes.BIGINT,
      pajak: DataTypes.BIGINT,
      grandTotal: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "Trx_Current_Assets",
    }
  );
  return Trx_Current_Assets;
};
