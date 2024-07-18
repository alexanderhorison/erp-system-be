"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Menu extends Model {
    static associate(models) {
      // define association here
    }
  }

  Master_Menu.init(
    {
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "Nama master menu tidak boleh kosong",
          },
        },
      },
      description: DataTypes.STRING,
      menuId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Master_Menu",
      paranoid: true,
    }
  );

  return Master_Menu;

};
