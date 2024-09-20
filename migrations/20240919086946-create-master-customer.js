"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Master_Customers",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
        },
        phoneNumber: {
          type: Sequelize.STRING,
        },
        email: {
          type: Sequelize.STRING,
        },
        address: {
          type: Sequelize.STRING,
        },
        gender: {
          type: Sequelize.STRING,
        },
        notes: {
          type: Sequelize.TEXT,
        },
        rankId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Master_Ranks", // Name of the target table
            key: "id", // Key in the target table that this column references
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        deletedAt: {
          type: Sequelize.DATE,
        },
      },
      {}
    );
    await queryInterface.addIndex("Master_Customers", ["rankId"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Master_Customers");
  },
};
