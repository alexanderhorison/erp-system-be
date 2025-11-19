const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const ExportReportService = require("../../services/export/ExportReportService");
const { REPORT_TYPE } = require("../../helpers/reportType");

class ExportReportController {
  static async exportReport(req, res) {
    try {
      const reportQuerySchema = yup.object({
        reportType: yup.string().required("Tipe Report harus diisi"),
        month: yup
          .number()
          .integer("Bulan harus tipe angka")
          .min(1, "Bulan Minimal adalah 1")
          .max(12, "Bulan Maksimal adalah 12")
          .when("reportType", {
            is: (val) => [REPORT_TYPE.SALES_ORDER].includes(val), // only required if Sales Order
            then: (schema) => schema.required("Bulan Report harus diisi"),
            otherwise: (schema) => schema.notRequired(),
          }),
        year: yup
          .number()
          .integer("Tahun harus tipe angka")
          .min(2025, "Tahun harus lebih dari 2025")
          .max(new Date().getFullYear(), "Hanya bisa diambil sampai tahun ini")
          .when("reportType", {
            is: (val) => [REPORT_TYPE.SALES_ORDER].includes(val), // only required if Sales Order
            then: (schema) => schema.required("Tahun Report harus diisi"),
            otherwise: (schema) => schema.notRequired(),
          }),
      });
      const query = await yupSchemaValidation(req.query, reportQuerySchema);

      // For Report that not send email
      if ([REPORT_TYPE.POS].includes(query.reportType)) {
        await ExportReportService.getReport({ query });
        res.status(200).json(responses(true, "Report berhasil dikirim"));
      } else {
        const { sheetName, file } = await ExportReportService.getReport({
          query,
        });

        // Kirim Excel sebagai respons
        res.set({
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${sheetName}"`,
          "Access-Control-Expose-Headers": "Content-Disposition",
        });

        res.end(file);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ExportReportController;
