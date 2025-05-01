"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change warehouseId to null because of sales order can create product in list product different warehouse
    await queryInterface.sequelize.query(`
      ALTER TABLE "Sales_Orders"
      ALTER COLUMN "warehouseId" DROP NOT NULL;
    `);

    // Remove NOT NULL constraint for `warehouseId` in Purchase_Orders
    await queryInterface.sequelize.query(`
      ALTER TABLE "Purchase_Orders"
      ALTER COLUMN "warehouseId" DROP NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Purchase_Orders", "warehouseId", {
      type: Sequelize.INTEGER,
      allowNull: false, // Revert back to NOT NULL in the down migration
      references: {
        model: "Master_Warehouses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await queryInterface.changeColumn("Sales_Orders", "warehouseId", {
      type: Sequelize.INTEGER,
      allowNull: false, // Revert back to NOT NULL in the down migration
      references: {
        model: "Master_Warehouses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
