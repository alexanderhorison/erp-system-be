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

    // Get the last menu to determine the next menuId
    const lastMenu = await queryInterface.sequelize.query(
      `SELECT id, "menuId" FROM "Menus" ORDER BY id DESC LIMIT 1;`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Set a default menuId of 1 if no menus exist or menuId is not present
    const nextMenuId = (lastMenu && lastMenu[0] && lastMenu[0].menuId) ? lastMenu[0].menuId + 1 : 1;

    await queryInterface.bulkInsert("Menus",
      [
        {
          name: "Company",
          description: "Manajemen Company Produk",
          createdAt: new Date(),
          updatedAt: new Date(),
          menuId: nextMenuId
        }
      ]
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Companies");
    await queryInterface.bulkDelete("Menus", { name: "Company" }, {});
  },
};
