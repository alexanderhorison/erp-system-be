'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Renaming columns in Audit_Trails table
    await queryInterface.renameColumn('Audit_Trails', 'action_by', 'actionBy');

    await queryInterface.renameColumn('Delivery_Orders', 'WarehouseOriginId', 'warehouseOriginId');
    await queryInterface.renameColumn('Delivery_Orders', 'WarehouseDestinationId', 'warehouseDestinationId');
    await queryInterface.renameColumn('Delivery_Orders', 'delivery_order_id', 'deliveryOrderId');

    await queryInterface.renameColumn('Product_Logs', 'data_before', 'dataBefore');
    await queryInterface.renameColumn('Product_Logs', 'data_after', 'dataAfter');
    await queryInterface.renameColumn('Product_Logs', 'UserId', 'userId');

    await queryInterface.renameColumn('Master_Products', 'CategoryId', 'categoryId');
    await queryInterface.renameColumn('Master_Products', 'TypeId', 'typeId');
    await queryInterface.renameColumn('Master_Products', 'CompanyId', 'companyId');

    await queryInterface.renameColumn('Master_Product_Transformations', 'MasterProductId', 'masterProductId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'UnitFromId', 'unitFromId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'amount_from', 'amountFrom');
    await queryInterface.renameColumn('Master_Product_Transformations', 'UnitToId', 'unitToId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'amount_to', 'amountTo');
    await queryInterface.renameColumn('Master_Product_Transformations', 'product_transformation_id', 'productTransformationId');

    await queryInterface.renameColumn('Delivery_Order_Products', 'ProductWarehouseId', 'productWarehouseId');
    await queryInterface.renameColumn('Delivery_Order_Products', 'delivery_order_id', 'deliveryOrderId');

    await queryInterface.renameColumn('Warehouse_Products', 'ProductId', 'productId');
    await queryInterface.renameColumn('Warehouse_Products', 'WarehouseId', 'warehouseId');
    await queryInterface.renameColumn('Warehouse_Products', 'UnitId', 'unitId');
    await queryInterface.renameColumn('Warehouse_Products', 'minimum_stock', 'minimumStock');

    await queryInterface.renameColumn('Master_Roles', 'MenuId', 'menuId');

    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'ProductWarehouseId', 'productWarehouseId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'adjustment_type', 'adjustmentType');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'WarehouseId', 'warehouseId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'UserId', 'userId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'delivery_order_id', 'deliveryOrderId');

    await queryInterface.renameColumn('Master_Users', 'user_name', 'userName');
    await queryInterface.renameColumn('Master_Users', 'RoleId', 'roleId');
    await queryInterface.renameColumn('Master_Users', 'WarehouseId', 'warehouseId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Audit_Trails', 'actionBy', 'action_by');

    await queryInterface.renameColumn('Delivery_Orders', 'warehouseOriginId', 'WarehouseOriginId');
    await queryInterface.renameColumn('Delivery_Orders', 'warehouseDestinationId', 'WarehouseDestinationId');
    await queryInterface.renameColumn('Delivery_Orders', 'deliveryOrderId', 'delivery_order_id');

    await queryInterface.renameColumn('Product_Logs', 'dataBefore', 'data_before');
    await queryInterface.renameColumn('Product_Logs', 'dataAfter', 'data_after');
    await queryInterface.renameColumn('Product_Logs', 'userId', 'UserId');

    await queryInterface.renameColumn('Master_Products', 'categoryId', 'CategoryId');
    await queryInterface.renameColumn('Master_Products', 'typeId', 'TypeId');
    await queryInterface.renameColumn('Master_Products', 'companyId', 'CompanyId');

    await queryInterface.renameColumn('Master_Product_Transformations', 'masterProductId', 'MasterProductId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'unitFromId', 'UnitFromId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'amountFrom', 'amount_from');
    await queryInterface.renameColumn('Master_Product_Transformations', 'unitToId', 'UnitToId');
    await queryInterface.renameColumn('Master_Product_Transformations', 'amountTo', 'amount_to');
    await queryInterface.renameColumn('Master_Product_Transformations', 'productTransformationId', 'product_transformation_id');

    await queryInterface.renameColumn('Delivery_Order_Products', 'productWarehouseId', 'ProductWarehouseId');
    await queryInterface.renameColumn('Delivery_Order_Products', 'deliveryOrderId', 'delivery_order_id');

    await queryInterface.renameColumn('Warehouse_Products', 'productId', 'ProductId');
    await queryInterface.renameColumn('Warehouse_Products', 'warehouseId', 'WarehouseId');
    await queryInterface.renameColumn('Warehouse_Products', 'unitId', 'UnitId');
    await queryInterface.renameColumn('Warehouse_Products', 'minimumStock', 'minimum_stock');

    await queryInterface.renameColumn('Master_Roles', 'menuId', 'MenuId');

    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'productWarehouseId', 'ProductWarehouseId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'adjustmentType', 'adjustment_type');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'warehouseId', 'WarehouseId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'userId', 'UserId');
    await queryInterface.renameColumn('Stock_Adjustment_Histories', 'deliveryOrderId', 'delivery_order_id');

    await queryInterface.renameColumn('Master_Users', 'userName', 'user_name');
    await queryInterface.renameColumn('Master_Users', 'roleId', 'RoleId');
    await queryInterface.renameColumn('Master_Users', 'warehouseId', 'WarehouseId');

  }
};
