const { Stock_Adjustment_History } = require("../../models");

class StockAdjustmentHistoryService {
  static async createOne({
    data,
    user,
    adjustment_type,
    quantity,
    info = null,
    delivery_order_id = null,
    transaction,
    description = null,
  }) {
    try {
      const createdHistory = {
        ProductWarehouseId: data.id,
        quantity: quantity,
        WarehouseId: data.WarehouseId,
        adjustment_type: adjustment_type,
        info,
        delivery_order_id,
        UserId: user.id,
        description,
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
