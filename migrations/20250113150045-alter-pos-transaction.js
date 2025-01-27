"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Pos_Transactions", "warehouseId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Master_Warehouses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // Action when the referenced row is deleted
    });

    await queryInterface.addIndex("Pos_Transactions", ["warehouseId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Pos_Transactions", "warehouseId");
  },
};
