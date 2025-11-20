const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardPurchaseOrderService = require("../../services/dashboard/DashboardPurchaseOrderService");

// 1. DashboardPo1: Top 5 Vendor yang total nominal PO nya paling bnyk
// 2. DashboardPo2: Top 5 Vendor yang total surat PO nya paling bnyk
// 3. DashboardPo3: Top 5 Vendor yang total hutang PO nya paling bnyk
// 4. DashboardPo4: Top 5 Vendor yang total barter PO nya paling bnyk

// 5. DashboardPo5: Grafik x = date , y = nominal PO per gudang

// 6. DashboardPo6: List 10 PO yang sudah lewat due date nya → pagination

class PurchaseOrderDashboardController {
  // GET DATA DASHBOARD PURCHASE ORDER 1-4
  static async getDashboardPo(req, res) {
    try {
      const { query } = req;

      const dashboard1 = await DashboardPurchaseOrderService.getDashboardPo1(
        query
      );
      const dashboard2 = await DashboardPurchaseOrderService.getDashboardPo2(
        query
      );
      const dashboard3 = await DashboardPurchaseOrderService.getDashboardPo3(
        query
      );
      const dashboard4 = await DashboardPurchaseOrderService.getDashboardPo4(
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
  // 6. DashboardPo6: List 10 PO yang sudah lewat due date nya → pagination
  static async getDashboardPoListOverDueDate(req, res) {
    try {
      const { query } = req;
      const data = await DashboardPurchaseOrderService.getDashboardPo6({
        query,
      });

      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // DASHBOARD DI MENU PURCHASE ORDER
  static async getDashboardMenuPurchaseOrder(req, res) {
    try {
      const data =
        await DashboardPurchaseOrderService.getDashboardMenuPurchaseOrder();

      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = PurchaseOrderDashboardController;
