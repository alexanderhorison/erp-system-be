'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Stock_Opname_Products', 'isAdjustment', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Stock_Opname_Products', 'isAdjustment')
  }
};
