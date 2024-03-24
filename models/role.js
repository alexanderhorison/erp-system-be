"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Role.hasMany(models.User, { foreignKey: "RoleId" });
    }
  }
  Role.init(
    {
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: "Nama Role tidak boleh kosong",
          },
        },
      },
      description: DataTypes.STRING,
      MenuId: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    {
      sequelize,
      modelName: "Role",
      paranoid: true,
      defaultScope: {
        where: {
          deletedAt: null, // Always exclude soft-deleted users by default
        },
      },
    }
  );
  return Role;
};
