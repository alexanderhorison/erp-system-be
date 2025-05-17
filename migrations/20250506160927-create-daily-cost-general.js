'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Daily_Cost_Generals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dailyCostId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Daily_Costs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      salesOrderId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Sales_Orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      depositBalance: {
        type: Sequelize.BIGINT
      },
      driverId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Tm_Employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      carsId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Tm_Cars",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      eMoneyBalance: {
        type: Sequelize.BIGINT
      },
      latestEMoneyBalance: {
        type: Sequelize.BIGINT
      },
      remainingEMoneyBalance: {
        type: Sequelize.BIGINT
      },
      tollCost: {
        type: Sequelize.BIGINT
      },
      fuelCost: {
        type: Sequelize.BIGINT
      },
      transportAllowance: {
        type: Sequelize.BIGINT
      },
      remainingDepositBalance: {
        type: Sequelize.BIGINT
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Daily_Cost_Generals');
  }
};