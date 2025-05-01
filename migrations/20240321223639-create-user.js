"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Users",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        description: {
          type: Sequelize.STRING,
        },
        email: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        user_name: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        password: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        RoleId: {
          allowNull: false,
          type: Sequelize.INTEGER,
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
      {
        indexes: [
          {
            unique: false,
            fields: ["RoleId"],
          },
        ],
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
