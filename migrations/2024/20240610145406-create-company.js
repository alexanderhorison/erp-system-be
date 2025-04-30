"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Companies", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
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

    const lastMenu = await queryInterface.sequelize.query(
      `SELECT id, "menuId" FROM "Menus" ORDER BY id DESC LIMIT 1;`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    await queryInterface.bulkInsert("Menus",
      [
        {
          name: "Company",
          description: "Manajemen Company Produk",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: lastMenu[0].menuId + 1
        }
      ]
    )

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Companies");
    await queryInterface.bulkDelete("Menus", { name: "Company" }, {});
  },
};
