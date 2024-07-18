"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Master_Role extends Model {
    static associate(models) {
      // define association here
      Master_Role.hasMany(models.Master_User, { foreignKey: "roleId" });
    }
  }

  Master_Role.init(
    {
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "Nama Master Role tidak boleh kosong",
          },
        },
      },
      description: DataTypes.STRING,
      menuId: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    {
      sequelize,
      modelName: "Master_Role",
      paranoid: true,
    }
  );

  return Master_Role;

};
