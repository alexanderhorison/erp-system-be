"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Master_Product extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Master_Product.belongsTo(models.Category, {
                foreignKey: "CategoryId",
            });
            Master_Product.belongsTo(models.Type, { foreignKey: "TypeId" });
        }
    }
    Master_Product.init(
        {
            name: DataTypes.STRING,
            CategoryId: DataTypes.INTEGER,
            TypeId: DataTypes.INTEGER,
            image: DataTypes.TEXT,
            description: DataTypes.TEXT,
        },
        {
            sequelize,
            modelName: "Master_Product",
            paranoid: true,
        }
    );
    return Master_Product;
};
