"use strict";

const { Op } = require("sequelize");
const { ROLES } = require("../../const/roles");
const {
  Sales_Order,
  Purchase_Order,
  Pr_Orders,
  Stock_Opname,
} = require("../../models");

class NotificationService {
  /**
   * Returns pending count per menu ID.
   * Admin (roleId === 1) sees all warehouses.
   * Other roles see only their own warehouseId.
   *
   * Menu IDs:
   *  15 - Stock Opname
   *  23 - Sales Order
   *  25 - Purchase Order
   *  44 - Product Request Order
   */
  static async getPendingCounts({ user }) {
    const isAdmin = Number(user.roleId) === ROLES.ADMIN;
    const warehouseId = user.warehouseId;

    const warehouseFilter = isAdmin ? {} : { warehouseId };

    const [
      salesOrderCount,
      purchaseOrderCount,
      productRequestOrderCount,
      stockOpnameCount,
    ] = await Promise.all([
      Sales_Order.count({
        where: { status: "PENDING", ...warehouseFilter },
      }),
      Purchase_Order.count({
        where: { status: "PENDING", ...warehouseFilter },
      }),
      // Pr_Orders has no warehouseId — show all pending regardless of user warehouse
      Pr_Orders.count({
        where: { status: "PENDING" },
      }),
      Stock_Opname.count({
        where: { status: "DRAFT", ...warehouseFilter },
      }),
    ]);

    return {
      23: salesOrderCount,
      25: purchaseOrderCount,
      44: productRequestOrderCount,
      15: stockOpnameCount,
    };
  }
}

module.exports = NotificationService;
