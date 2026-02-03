"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn("Master_Users", "pin", {
      type: Sequelize.STRING(4),
      allowNull: false,
      defaultValue: "1234",
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn("Master_Users", "pin");
  },
};
