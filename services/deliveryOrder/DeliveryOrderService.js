const { throwValidation } = require("../../helpers/responses");

class DeliveryOrderService {
  static async createDeliveryOrder(payload) {
    try {
      // Write logic here

      // Write return to controller
      return;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getAllDeliveryOrder(req, res) {
    try {
      // Write logic here

      // Write return to controller
      return;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDetailDeliveryOrder(req, res) {
    try {
      // Write logic here

      // Write return to controller
      return;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DeliveryOrderService;
