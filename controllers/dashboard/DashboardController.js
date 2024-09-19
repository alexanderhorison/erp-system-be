const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardService = require("../../services/dashboard/DashboardService");

class DashboardController {
  static async minimumStock(req, res) {
    try {
      const getMiminumWarehouseProduct = await DashboardService.minimumStock();
      res
        .status(200)
        .json(responses(true, "Berhasil", getMiminumWarehouseProduct));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DashboardController;
