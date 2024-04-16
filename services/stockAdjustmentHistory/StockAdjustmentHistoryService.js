const { Stock_Adjustment_History } = require("../../models");

class StockAdjustmentHistoryService {
  static async createOne({
    data,
    user,
    adjustment_type,
    quantity,
    transaction,
  }) {
    try {
      const createdHistory = {
        ProductWarehouseId: data.id,
        quantity: quantity,
        WarehouseId: data.WarehouseId,
        adjustment_type: adjustment_type,
        UserId: user.id,
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
