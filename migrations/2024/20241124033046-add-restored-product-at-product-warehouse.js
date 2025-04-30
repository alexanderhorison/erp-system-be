'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Warehouse_Products", "restoredAt", { type: Sequelize.DATE });
    await queryInterface.addColumn("Warehouse_Products", "restoredBy", { type: Sequelize.INTEGER });

    await queryInterface.addConstraint("Warehouse_Products", {
      fields: ["restoredBy"],
      type: "foreign key",
      name: "fk_Warehouse_Products_restoredAt_restoredBy", // Custom name for the constraint
      references: {
        table: "Master_Users", // Name of the referenced table
        field: "id", // Primary key in the referenced table
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // Action when the referenced row is deleted
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Warehouse_Products", "restoredAt");
    await queryInterface.removeColumn("Warehouse_Products", "restoredBy");
  }
};
