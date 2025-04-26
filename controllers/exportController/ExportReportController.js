const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const ExportReportService = require("../../services/export/exportReportService");
const yup = require("yup");
const fs = require("fs");


class ExportReportController {
  static async exportReportSo(req, res) {
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
          .min(2023, "Tahun harus lebih dari 2023")
          .max(new Date().getFullYear(), "Hanya bisa diambil sampai tahun ini"),
      });

      const query = await yupSchemaValidation(req.query, reportQuerySchema);

      const {filePath, sheetName} = await ExportReportService.getReportSo({ query });

      res.download(filePath, `${sheetName}.xlsx`, (err) => {
        if (err) console.error("Download error:", err);
        fs.unlinkSync(filePath); // Delete file after sending
      });
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ExportReportController;
