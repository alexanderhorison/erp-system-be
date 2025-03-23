const ExportService = require("../../services/export/exportService");
const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

class ExportController {
  static async salesOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code sales order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.salesOrder(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Sales Order #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async purchaseOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code purchase order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.purchaseOrder(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Purchase Order #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async deliveryOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code delivery order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.deliveryOrder(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Delivery Order #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async deliveryOrderReceive(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code delivery order receipt harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.deliveryOrderReceive(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Delivery Order Receipt #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async deliveryOrderReceiveOutstanding(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup
          .string()
          .required("Code Delivery Order Receipt Outstanding harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.deliveryOrderReceiveOutstanding(
        code
      );

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Delivery Order Receipt Outstanding #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async stockOpname(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Stock Opname harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const excelFile = await ExportService.stockOpnameExcel(code);

      const fileName = `Stock Opname #${code}.xlsx`;

      // Kirim Excel sebagai respons
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      });

      res.end(excelFile);
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async adjustmentGoodsIn(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Goods In harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.adjustmentGoodsIn(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Goods In #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async adjustmentGoodsOut(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Goods Out harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.adjustmentGoodsOut(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Goods Out #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async internalTransfer(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Internal Transfer harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportService.internalTransfer(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Internal Transfer #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error generating PDF",
          error: error.message,
        });
    }
  }

  static async allStock(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id gudang tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.warehouseId, schemaParams);

      await ExportService.allStock({ res, warehouseId: id });
    } catch (error) {
      res
        .status(500)
        .json({
          status: false,
          message: "Error export all stock",
          error: error.message,
        });
    }
  }
}

module.exports = ExportController;
