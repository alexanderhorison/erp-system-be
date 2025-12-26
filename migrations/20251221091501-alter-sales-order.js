'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add column isLoanStockSO to Sales_Orders table
     */
    await queryInterface.addColumn('Sales_Orders', 'isLoanStockSO', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Revert: Remove isLoanStockSO column from Sales_Orders table
     */
    await queryInterface.removeColumn('Sales_Orders', 'isLoanStockSO');
  }
};
