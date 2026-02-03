"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User_Shift extends Model {
    static associate(models) {
      // define association here
      User_Shift.belongsTo(models.Master_User, {
        foreignKey: "userId",
      });
      User_Shift.belongsTo(models.Master_Shift, {
        foreignKey: "masterShiftId",
      });
    }
  }

  User_Shift.init(
    {
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
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: `User ID tidak boleh kosong`,
          },
        },
      },
      masterShiftId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: `Master Shift ID tidak boleh kosong`,
          },
        },
      },
      totalTransaction: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      grandTotalTransaction: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "User_Shift",
      tableName: "User_Shifts",
      paranoid: true,
    }
  );

  return User_Shift;
};