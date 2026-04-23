"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Pos_Transactions", "posUserShiftId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Pos_User_Shifts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("Pos_Transactions", ["posUserShiftId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Pos_Transactions", "posUserShiftId");
  },
};