const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const ExportReportService = require("../../services/export/exportReportService");
const yup = require("yup");


class ExportReportController {
  static async exportReport(req, res) {
    try {
      const reportQuerySchema = yup.object({
        reportType: yup.string().required("Tipe Report harus diisi"),
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

      const { sheetName, file } = await ExportReportService.getReport({ query });

      // Kirim Excel sebagai respons
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sheetName}"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      });

      res.end(file);
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ExportReportController;
