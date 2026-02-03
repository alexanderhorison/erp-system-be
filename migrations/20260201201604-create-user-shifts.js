"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "User_Shifts",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        startShift: {
          allowNull: false,
          type: Sequelize.TIME,
        },
        endShift: {
          allowNull: true,
          type: Sequelize.TIME,
        },
        userId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: "Master_Users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        masterShiftId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: "Master_Shifts",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        totalTransaction: {
          allowNull: false,
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        grandTotalTransaction: {
          allowNull: false,
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
        deletedAt: {
          type: Sequelize.DATE,
        },
      },
      {
        indexes: [
          {
            fields: ["userId"],
          },
          {
            fields: ["masterShiftId"],
          },
          {
            fields: ["createdAt"],
          },
        ],
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("User_Shifts");
  },
};