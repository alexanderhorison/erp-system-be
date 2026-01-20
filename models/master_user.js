"use strict";
const { Model } = require("sequelize");
const { encrypt } = require("../helpers/bcrypt");
module.exports = (sequelize, DataTypes) => {
  class Master_User extends Model {

    static associate(models) {
      // define association here
      Master_User.belongsTo(models.Master_Role, {
        foreignKey: "roleId",
      });
      Master_User.belongsTo(models.Master_Warehouse, {
        foreignKey: "warehouseId",
      });
      Master_User.hasMany(models.Delivery_Order, { foreignKey: "createdBy" });
      Master_User.hasMany(models.Delivery_Order, { foreignKey: "receivedBy" });
      Master_User.hasMany(models.Master_Product_Transformation, { foreignKey: "createdBy" });
    }
  }

  Master_User.init(
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
      userName: {
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
      pin: {
        type: DataTypes.STRING(4),
        allowNull: false,
        defaultValue: '1234',
        validate: {
          notEmpty: {
            args: true,
            msg: `Pin tidak boleh kosong`,
          },
          is: {
            args: /^\d{4}$/,
            msg: 'Pin harus 4 digit',
          },
        },
      },
      roleId: {
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: {
            args: true,
            msg: "Role Tidak boleh kosong",
          },
        },
      },
      warehouseId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "Master_User",
      hooks: {
        beforeCreate: (user) => {
          user.password = encrypt(user.password);
        },
        beforeUpdate: (user) => {
          if (user.changed('password')) {
            user.password = encrypt(user.password);
          }
        },
      },
      paranoid: true,
    }
  );

  return Master_User;

};
