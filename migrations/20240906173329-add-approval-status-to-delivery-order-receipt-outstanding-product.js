'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('Delivery_Order_Receipt_Outstandings', 'approvedBy', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Master_Users',
        key: 'id'
      },
      allowNull: true
    })

    await queryInterface.addColumn('Delivery_Order_Receipt_Outstandings', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    })

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Delivery_Order_Receipt_Outstandings', 'approvedBy')
    await queryInterface.removeColumn('Delivery_Order_Receipt_Outstandings', 'approvedAt')
  }
};
