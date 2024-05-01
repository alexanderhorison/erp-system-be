const {
  sequelize: sq,
  Master_Product,
  Master_Product_History,
  Type,
  Category,
  Product_Warehouse,
  Unit,
  Delivery_Order,
  Product_Delivery_Order,
  User,
  Warehouse,
  Role,
} = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { formatDate } = require("../../helpers/formatDate");

class DeliveryOrderReceiveService {
  static async updateDeliveryOrder(deliveryOrderId, user) {
    try {
      return;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderReceiveService;
