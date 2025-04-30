'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tm_Unexpected_Cost_Categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
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
        name: "Master Cost Tak Terduga",
        description: "Master Kategori Cost Tak Terduga",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 29,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tm_Unexpected_Cost_Categories');
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 29,
    });
  }
};