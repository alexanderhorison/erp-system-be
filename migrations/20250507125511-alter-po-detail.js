'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Purchase_Order_Details", "isNewModal", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("Sales_Order_Barter_Details", "isNewModal", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sales_Order_Barter_Details", "isNewModal");
    await queryInterface.removeColumn("Purchase_Order_Details", "isNewModal");
  }
};
