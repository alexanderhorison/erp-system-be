const {
  sequelize: sq,
  Stock_Adjustment_History,
  Warehouse_Product,
} = require("../../models");

class MigrationService {
  static async apiMigration(migrationName) {
    const transaction = await sq.transaction();
    try {
      switch (migrationName) {
        case "MIGRATION LAST QUANTITY":
          /**
           * data product warehouse id = get all stock adjustment history distinct by product warehouse id
           * loop data product warehouse id
           *  - Find stock adjustment history by product warehouse id (ASC)
           *    - if type minus -> last quantity - quantity
           *    - if type plus -> last quantity + quantity
           *    Update current id (last quantity based on formula)
           *  - Get current quantity right now in warehouse product compare with last quantity
           */
          console.log("masuk migrasi last quantity");

          // Find All Stock in stock adjustment History
          const findAllStock = await Stock_Adjustment_History.findAll({
            attributes: [
              [
                sq.fn("DISTINCT", sq.col("productWarehouseId")),
                "productWarehouseId",
              ],
            ],
            group: ["productWarehouseId"],
            raw: true,
          });

          // Loop data stock
          for (let i = 0; i < findAllStock.length; i++) {
            const productWarehouseId = findAllStock[i].productWarehouseId;

            // find productWarehouse to get current quantity
            const productWarehouse = await Warehouse_Product.findOne({
              attributes: ["quantity"],
              where: {
                id: productWarehouseId,
              },
              raw: true,
            });

            if (!productWarehouse) {
              continue;
            }

            const currentQuantity = await this.processStockAdjustmentHistory(
              productWarehouseId,
              transaction
            );

            // Make sure quantity is same
            if (currentQuantity !== productWarehouse.quantity) {
              throw {
                code: 400,
                message: `Mismatch in quantity for productWarehouseId: ${productWarehouseId}. Expected: ${productWarehouse.quantity}, Found: ${currentQuantity}`,
              };
            }
          }
          break;

        default:
          break;
      }
      await transaction.commit();
      return "success";
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static getQuantityValue(quantity, historyQuantity, type) {
    let result = 0;
    if (type === "PLUS") {
      result = quantity + historyQuantity;
    } else if (type === "MINUS") {
      result = quantity - historyQuantity;
    } else if (type === "INITIATE") {
      result = historyQuantity;
    }
    return result;
  }

  static async processStockAdjustmentHistory(productWarehouseId, transaction) {
    // find stock adjustment history by productWarehouseId
    const findStockWarehouse = await Stock_Adjustment_History.findAll({
      where: {
        productWarehouseId: productWarehouseId,
      },
      order: [["id", "ASC"]],
      raw: true,
    });

    let currentQuantity = 0;

    for (let j = 0; j < findStockWarehouse.length; j++) {
      const data = findStockWarehouse[j];

      // if index j = 0 straight update lastQuantity
      if (j == 0) {
        // First must be initiate
        await Stock_Adjustment_History.update(
          {
            lastQuantity: data.quantity,
          },
          { where: { id: data.id }, transaction }
        );
        // Set Current Quantity based on initiate
        currentQuantity = this.getQuantityValue(
          currentQuantity,
          data.quantity,
          data.adjustmentType
        );
      } else {
        // Perform math quantity based on adjustment type (PLUS or MINUS)
        currentQuantity = this.getQuantityValue(
          currentQuantity,
          data.quantity,
          data.adjustmentType
        );

        await Stock_Adjustment_History.update(
          {
            lastQuantity: currentQuantity,
          },
          { where: { id: data.id }, transaction }
        );
      }
    }

    return currentQuantity;
  }
}

module.exports = MigrationService;
