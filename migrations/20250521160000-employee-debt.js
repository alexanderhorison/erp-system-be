"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add column debt to Tm_Employees
    await queryInterface.addColumn("Tm_Employees", "debt", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });

    // 2. Create Trx_Employee_Debt table
    await queryInterface.createTable("Trx_Employee_Debts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      dailyCostEmployeeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Daily_Cost_Employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      employeeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Tm_Employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 3. Add amountDebtPaid and amountDebt to Daily_Cost_Employees
    await queryInterface.addColumn("Daily_Cost_Employees", "amountDebtPaid", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Daily_Cost_Employees", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("Daily_Cost_Employees", "amountDebt", {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tm_Employees", "debt");
    await queryInterface.dropTable("Trx_Employee_Debts");
    await queryInterface.removeColumn("Daily_Cost_Employees", "amountDebtPaid");
    await queryInterface.removeColumn("Daily_Cost_Employees", "notes");
    await queryInterface.removeColumn("Daily_Cost_Employees", "amountDebt");
  },
};
