"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Trx_Current_Assets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      kasAndBank: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      piutangUsaha: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      pihakKetiga: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      piutangLain: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      persediaan: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      uangMuka: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      pajak: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      grandTotal: {
        type: Sequelize.BIGINT,
        allowNull: false,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Trx_Current_Assets");
  },
};
