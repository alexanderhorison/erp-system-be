"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Dashboard_Summary_Customers",
      "totalAmountBarterSalesOrder",
      {
        type: Sequelize.BIGINT,
      }
    );
    await queryInterface.addColumn(
      "Dashboard_Summary_Vendors",
      "totalAmountBarterPurchaseOrder",
      {
        type: Sequelize.BIGINT,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Dashboard_Summary_Vendors",
      "totalAmountBarterPurchaseOrder"
    );
    await queryInterface.removeColumn(
      "Dashboard_Summary_Customers",
      "totalAmountBarterSalesOrder"
    );
  },
};
