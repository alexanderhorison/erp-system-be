"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("Delivery_Orders", "receivedAt", {
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn("Delivery_Orders", "receivedBy", {
      type: Sequelize.INTEGER,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Delivery_Orders", "receivedBy");
    await queryInterface.removeColumn("Delivery_Orders", "receivedAt");
  },
};
