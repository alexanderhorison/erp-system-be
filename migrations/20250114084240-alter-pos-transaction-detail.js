"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Pos_Transaction_Details"
      ALTER COLUMN "warehouseProductId" DROP NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Pos_Transaction_Details", "warehouseProductId", {
      type: Sequelize.INTEGER,
      allowNull: false, // Revert back to NOT NULL in the down migration
      references: {
        model: "Warehouse_Products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
