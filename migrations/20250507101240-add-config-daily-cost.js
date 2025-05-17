'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Configs', [
      {
        key: 'DC_TRANSPORT_ALLOWANCE',
        value: '0',
        category: 'DAILY_COST',
        value_json: null,
        description: 'Biaya Transport',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'DC_DEPOSIT',
        value: '0',
        category: 'DAILY_COST',
        value_json: null,
        description: 'Biaya Deposit',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'DC_TOLL_COST',
        value: '0',
        category: 'DAILY_COST',
        value_json: null,
        description: 'Biaya Tol',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'DC_FUEL_COST',
        value: '0',
        category: 'DAILY_COST',
        value_json: null,
        description: 'Biaya BBM',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Configs', {
      key: {
        [Sequelize.Op.or]: [
          'DC_TRANSPORT_ALLOWANCE',
          'DC_DEPOSIT',
          'DC_TOLL_COST',
          'DC_FUEL_COST'
        ]
      }
    });
  }
};
