"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Master_Product_Prices", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Master_Units",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      basePrice: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("Master_Product_Prices", ["productId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Master_Product_Prices");
  },
};
