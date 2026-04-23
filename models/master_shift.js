"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Master_Shift extends Model {
    static associate(models) {
      // define association here
      Master_Shift.hasMany(models.Pos_User_Shift, {
        foreignKey: "masterShiftId",
      });
    }
  }

  Master_Shift.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: `Nama shift tidak boleh kosong`,
          },
        },
      },
      startShift: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: `Jam mulai shift tidak boleh kosong`,
          },
        },
      },
      endShift: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: `Jam selesai shift tidak boleh kosong`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Master_Shift",
      tableName: "Master_Shifts",
      paranoid: true,
    }
  );

  return Master_Shift;
};