"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Pos_Transactions", "queueNumber", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Pos_Transactions", "queueNumber");
  },
};
