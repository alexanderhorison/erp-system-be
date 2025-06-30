'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Tm_Non_Current_Assets', 'depreciationActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if depreciation is active for the non-current asset'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tm_Non_Current_Assets', 'depreciationActive');
  }
};
