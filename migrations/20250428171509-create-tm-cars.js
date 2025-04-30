'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tm_Cars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      plate_number: {
        type: Sequelize.TEXT
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Master Mobil",
        description: "Master Mobil",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 31,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tm_Cars');
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 31,
    });
  }
};