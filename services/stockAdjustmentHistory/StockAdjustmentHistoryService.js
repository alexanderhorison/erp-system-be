const { Stock_Adjustment_History } = require("../../models");

class StockAdjustmentHistoryService {
  static async createOne({
    data,
    user,
    adjustmentType,
    quantity,
    info = null,
    deliveryOrderId = null,
    transaction,
    description = null,
    lastQuantity = null,
  }) {
    try {
      const createdHistory = {
        productWarehouseId: data.id,
        quantity: quantity,
        warehouseId: data.warehouseId,
        adjustmentType: adjustmentType,
        info,
        deliveryOrderId,
        userId: user.id,
        description,
        lastQuantity,
      };

      const createHistoryAdjusment = await Stock_Adjustment_History.create(
        createdHistory,
        { transaction }
      );
      return createHistoryAdjusment;
    } catch (error) {
      throw error;
    }
  }

  static async bulkCreate({
    data,
    transaction
  }) {
    try {
      const createHistoryAdjusment = await Stock_Adjustment_History.bulkCreate(
        data,
        { transaction }
      );
      return createHistoryAdjusment;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockAdjustmentHistoryService;
