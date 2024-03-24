"use strict";
const { Model } = require("sequelize");
const { encrypt } = require("../helpers/bcrypt");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: "RoleId",
      });
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: `Nama tidak boleh kosong`,
          },
        },
      },
      description: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: `Email tidak boleh kosong`,
          },
        },
      },
      user_name: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: `Username tidak boleh kosong`,
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            args: true,
            msg: `password tidak boleh kosong`,
          },
        },
      },
      RoleId: {
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: {
            args: true,
            msg: "Role Tidak boleh kosong",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user) => {
          user.password = encrypt(user.password);
        },
        beforeUpdate: (user) => {
          user.password = encrypt(user.password);
        },
      },
      paranoid: true,
      defaultScope: {
        where: {
          deletedAt: null, // Always exclude soft-deleted users by default
        },
      },
    }
  );
  return User;
};
