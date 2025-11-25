const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardService = require("../../services/dashboard/DashboardService");
const DashboardSalesOrderService = require("../../services/dashboard/DashboardSalesOrderService");

// 1. DashboardSo1: Top 5 Customer yang total nominal SO nya paling bnyk
// 2. DashboardSo2: Top 5 Customer yang total surat SO nya paling bnyk
// 3. DashboardSo3: Top 5 Customer yang total hutang SO nya paling bnyk
// 4. DashboardSo4: Top 5 Customer yang total barter SO nya paling bnyk

// 5. DashboardSo5: Grafik x = date , y = nominal SO per gudang

// 6. DashboardSo6: List 10 SO yang sudah lewat due date nya → pagination

class SalesOrderDashboardController {
  // GET DATA DASHBOARD SALES ORDER 1-4
  static async getDashboardSo(req, res) {
    try {
      const { query } = req;

      const dashboard1 = await DashboardSalesOrderService.getDashboardSo1(
        query
      );
      const dashboard2 = await DashboardSalesOrderService.getDashboardSo2(
        query
      );
      const dashboard3 = await DashboardSalesOrderService.getDashboardSo3(
        query
      );
      const dashboard4 = await DashboardSalesOrderService.getDashboardSo4(
        query
      );

      const result = {
        dashboard1,
        dashboard2,
        dashboard3,
        dashboard4,
      };
      res.status(200).json(responses(true, "Berhasil", result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 6. DashboardSo6: List 10 SO yang sudah lewat due date nya → pagination
  static async getDashboardSoListOverDueDate(req, res) {
    try {
      const { query } = req;
      const data = await DashboardSalesOrderService.getDashboardSo6({ query });

      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // DASHBOARD DI MENU SALES ORDER
  static async getDasboardMenuSalesOrder(req, res) {
    try {
      const data =
        await DashboardSalesOrderService.getDashboardMenuSalesOrder();

      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = SalesOrderDashboardController;
