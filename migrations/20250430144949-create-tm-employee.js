"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Tm_Employees", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.TEXT,
      },
      dob: {
        type: Sequelize.DATE,
      },
      sex: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      salary: {
        type: Sequelize.BIGINT,
      },
      bonus: {
        type: Sequelize.BIGINT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.bulkInsert("Master_Menus", [
      {
        name: "Karyawan",
        description: "Karyawan",
        createdAt: new Date(),
        updatedAt: new Date(),
        menuId: 32,
      },
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Tm_Employees");
    await queryInterface.bulkDelete("Master_Menus", {
      menuId: 32,
    });
  },
};
