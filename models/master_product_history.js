"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Master_Product_History extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Master_Product_History.init(
        {
            name: DataTypes.STRING,
            data_before: DataTypes.TEXT,
            data_after: DataTypes.TEXT,
            UserId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: "Master_Product_History",
        }
    );
    return Master_Product_History;
};
