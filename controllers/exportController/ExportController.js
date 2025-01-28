const ExportService = require('../../services/export/exportService');
// const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { priceFormatWIthCurrency } = require('../../helpers/priceFormat');
const { responses } = require('../../helpers/responses');
const PurchaseOrderService = require('../../services/purchaseOrder/PurchaseOrderService');
const yup = require("yup");
const { yupSchemaValidation } = require('../../helpers/yupSchemaValidation');

class ExportController {
  static async salesOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code sales order harus ada"),
      })

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code

      const pdfBuffer = await ExportService.salesOrder(code);

      const fileName = `Sales Order #${code}.pdf`;

      // Kirim PDF sebagai respons
      res.set({
        'Content-Type': 'application/pdf',
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      res.end(pdfBuffer);

    } catch (error) {
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
  }

  static async purchaseOrder(req, res) {
    try {

      const schemaParams = yup.object({
        code: yup.string().required("Code sales order harus ada"),
      })

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code

      const pdfBuffer = await ExportService.purchaseOrder(code);

      const fileName = `Purchase Order #${code}.pdf`;

      // Kirim PDF sebagai respons
      res.set({
        'Content-Type': 'application/pdf',
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      res.end(pdfBuffer);

    } catch (error) {
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
  }

  static async testing(req, res) {
    try {
      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil approval internal transfer rak",
            // approveInternalTransfer
          )
        );
    } catch (error) {
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
  }
}

module.exports = ExportController;
