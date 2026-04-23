"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Pos_User_Shift extends Model {
    static associate(models) {
      // define association here
      Pos_User_Shift.belongsTo(models.Master_User, {
        foreignKey: "userId",
      });
      Pos_User_Shift.belongsTo(models.Master_Shift, {
        foreignKey: "masterShiftId",
      });
      Pos_User_Shift.hasMany(models.Pos_Transaction, {
        foreignKey: "posUserShiftId",
      });
    }
  }

  Pos_User_Shift.init(
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
      modelName: "Pos_User_Shift",
      tableName: "Pos_User_Shifts",
      paranoid: true,
    }
  );

  return Pos_User_Shift;
};
