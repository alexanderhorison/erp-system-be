"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Master_Shifts",
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
        startShift: {
          allowNull: false,
          type: Sequelize.TIME,
        },
        endShift: {
          allowNull: false,
          type: Sequelize.TIME,
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
            unique: true,
            fields: ["name"],
            where: {
              deletedAt: null,
            },
          },
        ],
      }
    );
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Shift",
        description: "Master Data Shift",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 48,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 48,
    });
    await queryInterface.dropTable("Master_Shifts");
  },
};