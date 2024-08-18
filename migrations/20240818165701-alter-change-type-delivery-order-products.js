'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Delivery_Order_Products', 'deliveryOrderId_temp', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Allow NULLs
    });

    // Step 2: Copy data to the new column, casting as needed
    await queryInterface.sequelize.query(`
      UPDATE "Delivery_Order_Products" dop
      SET "deliveryOrderId_temp" = do2.id
      FROM "Delivery_Orders" do2
      WHERE dop."deliveryOrderId" = do2."deliveryOrderId";
    `);

    await queryInterface.removeColumn('Delivery_Order_Products', 'deliveryOrderId');

    await queryInterface.renameColumn('Delivery_Order_Products', 'deliveryOrderId_temp', 'deliveryOrderId');
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn('Delivery_Order_Products', 'deliveryOrderId_temp', {
      type: Sequelize.STRING,
      allowNull: true,  // Allow NULLs
    });

    // Step 2: Copy data to the new column, casting as needed
    await queryInterface.sequelize.query(`
      UPDATE "Delivery_Order_Products" dop
      SET "deliveryOrderId_temp" = do2."deliveryOrderId"
      FROM "Delivery_Orders" do2
      WHERE dop."deliveryOrderId" = do2.id;
    `);

    await queryInterface.removeColumn('Delivery_Order_Products', 'deliveryOrderId');

    await queryInterface.renameColumn('Delivery_Order_Products', 'deliveryOrderId_temp', 'deliveryOrderId');
  }
};
