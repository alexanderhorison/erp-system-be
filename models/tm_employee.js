"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tm_Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tm_Employee.init(
    {
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Nama karyawan tidak boleh kosong",
          },
        },
      },
      phone: DataTypes.STRING,
      address: DataTypes.TEXT,
      dob: DataTypes.DATE,
      sex: DataTypes.STRING,
      role: DataTypes.STRING,
      status: DataTypes.STRING,
      salary: DataTypes.BIGINT,
      bonus: DataTypes.BIGINT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Tm_Employee",
      paranoid: true,
    }
  );
  return Tm_Employee;
};
