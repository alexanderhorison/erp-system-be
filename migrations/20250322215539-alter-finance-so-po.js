"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sales_Orders", "totalModal", {
      type: Sequelize.BIGINT,
    });
    await queryInterface.addColumn("Sales_Orders", "totalGainLoss", {
      type: Sequelize.BIGINT,
    });
    await queryInterface.addColumn("Sales_Order_Details", "gainLoss", {
      type: Sequelize.BIGINT,
    });
    await queryInterface.addColumn(
      "Purchase_Order_Barter_Details",
      "gainLoss",
      {
        type: Sequelize.BIGINT,
      }
    );
    await queryInterface.addColumn("Purchase_Orders", "totalModal", {
      type: Sequelize.BIGINT,
    });
    await queryInterface.addColumn("Purchase_Orders", "totalGainLoss", {
      type: Sequelize.BIGINT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Purchase_Orders", "totalGainLoss");
    await queryInterface.removeColumn("Purchase_Orders", "totalModal");
    await queryInterface.removeColumn(
      "Purchase_Order_Barter_Details",
      "gainLoss"
    );
    await queryInterface.removeColumn("Sales_Order_Details", "gainLoss");
    await queryInterface.removeColumn("Sales_Orders", "totalGainLoss");
    await queryInterface.removeColumn("Sales_Orders", "totalModal");
  },
};
