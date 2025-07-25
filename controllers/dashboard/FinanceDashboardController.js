const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardFinanceService = require("../../services/dashboard/DashboardFinanceService");

class FinanceDashboardController {
  // Example method to get revenue data
  static async getRevenue(req, res) {
    try {
      const reportQuerySchema = yup.object({
        month: yup
          .number()
          .required("Bulan Report harus diisi")
          .integer("Bulan harus tipe angka")
          .min(1, "Bulan Minimal adalah 1")
          .max(12, "Bulan Maksimal adalah 12"),
        year: yup
          .number()
          .required("Tahun Report harus diisi")
          .integer("Tahun harus tipe angka")
          .min(2025, "Tahun harus lebih dari 2025")
          .max(new Date().getFullYear(), "Hanya bisa diambil sampai tahun ini"),
      });

      const query = await yupSchemaValidation(req.query, reportQuerySchema);

      // Logic to fetch revenue data
      const revenueData = await DashboardFinanceService.getRevenue({ query });
      res.status(200).json(responses(true, "Revenue data fetched successfully", revenueData));
    } catch (error) {
      res.status(500).json(responses(false, error.message || error));
    }
  }

  static async getProfitLoss(req, res) {
    try {
      const reportQuerySchema = yup.object({
        year: yup
          .number()
          .required("Tahun Report harus diisi")
          .integer("Tahun harus tipe angka")
          .min(2025, "Tahun harus lebih dari 2025")
          .max(new Date().getFullYear(), "Hanya bisa diambil sampai tahun ini"),
        typeOfMonth: yup.
          string()
          .required("Tipe bulan harus diisi")
          .oneOf(["quarter", "semester"], "Tipe bulan harus 'quarter' atau 'semester'"),
        period: yup
          .number()
          .required("Periode bulan harus diisi")
          .integer("Periode harus tipe angka")
          .min(1, "Periode Minimal adalah 1")
          .max(4, "Periode Maksimal adalah 4 untuk quarter atau 2 untuk semester"),
      });

      const query = await yupSchemaValidation(req.query, reportQuerySchema);

      // Logic to fetch profit loss data
      const profitLoss = await DashboardFinanceService.getProfitLoss({ query });
      res.status(200).json(responses(true, "Profit Loss fetched successfully", profitLoss));
    } catch (error) {
      res.status(500).json(responses(false, error.message || error));
    }
  }

  static async getProfitLossYearly(req, res) {
    try {
      // Logic to fetch profit loss yearly data
      const profitLoss = await DashboardFinanceService.getProfitLossYearly();
      res.status(200).json(responses(true, "Profit Loss Yearly fetched successfully", profitLoss));
    } catch (error) {
      res.status(500).json(responses(false, error.message || error));
    }
  }
}

module.exports = FinanceDashboardController;
