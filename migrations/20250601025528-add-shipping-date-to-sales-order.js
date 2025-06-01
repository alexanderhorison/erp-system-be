'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Sales_Orders', 'shippingDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 2. Backfill: Set shippingDate = approvedAt where approvedAt is not null
    await queryInterface.sequelize.query(`
      UPDATE "Sales_Orders"
      SET "shippingDate" = "approvedAt"
      WHERE "approvedAt" IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Sales_Orders', 'shippingDate');
  }
};
