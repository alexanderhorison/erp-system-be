'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add a new temporary column with INTEGER type
    await queryInterface.addColumn('Stock_Adjustment_Histories', 'deliveryOrderId_temp', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Allow NULLs
    });

    // Step 2: Copy data to the new column, casting as needed
    await queryInterface.sequelize.query(`
      UPDATE "Stock_Adjustment_Histories"
      SET "deliveryOrderId_temp" = CAST("deliveryOrderId" AS INTEGER)
      WHERE "deliveryOrderId" ~ '^[0-9]+$' AND "deliveryOrderId" IS NOT NULL
    `);

    // Step 3: Drop the old column
    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'deliveryOrderId');

    // Step 4: Rename the new column to the old column's name
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'deliveryOrderId_temp', 'deliveryOrderId');
  },

  down: async (queryInterface, Sequelize) => {
    // If needed, reverse the process: create the old column, copy data back, and drop the new column

    // Step 1: Add the old column with STRING type
    await queryInterface.addColumn('Stock_Adjustment_Histories', 'deliveryOrderId_temp', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Step 2: Copy data back to the old column
    await queryInterface.sequelize.query(`
      UPDATE "Stock_Adjustment_Histories"
      SET "deliveryOrderId_temp" = CAST("deliveryOrderId" AS TEXT)
      WHERE "deliveryOrderId" IS NOT NULL
    `);

    // Step 3: Drop the new INTEGER column
    await queryInterface.removeColumn('Stock_Adjustment_Histories', 'deliveryOrderId');

    // Step 4: Rename the old column back to the original name
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'deliveryOrderId_temp', 'deliveryOrderId');
  }
};
