const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

const ExportSalesOrderService = require("../../services/export/ExportSalesOrderService");
const ExportPurchaseOrderService = require("../../services/export/ExportPurchaseOrderService");
const ExportGoodsOutService = require("../../services/export/ExportGoodsOutService");
const ExportDeliveryOrderService = require("../../services/export/ExportDeliveryOrderService");
const ExportDeliveryOrderReceiveService = require("../../services/export/ExportDeliveryOrderReceiveService");
const ExportDeliveryOrderReceiveOutstandingService = require("../../services/export/ExportDeliveryOrderReceiveOutstandingService");
const ExportStockOpnameService = require("../../services/export/ExportStockOpnameService");
const ExportInternalTransferService = require("../../services/export/ExportInternalTransferService");
const ExportAllStockService = require("../../services/export/ExportAllStockService");
const ExportReportGoodsInService = require("../../services/export/ExportGoodsInService");
const ExportProductRequestOrderService = require("../../services/export/ExportProductRequestService");

class ExportController {

  // DONE
  static async salesOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code sales order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportSalesOrderService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Sales Order #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async purchaseOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code purchase order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportPurchaseOrderService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Purchase Order #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async deliveryOrder(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code delivery order harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportDeliveryOrderService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Delivery Order #${code}.pdf`,
        mimeType: "application/pdf",
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async deliveryOrderReceive(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code delivery order receipt harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportDeliveryOrderReceiveService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Delivery Order Receipt #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async deliveryOrderReceiveOutstanding(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup
          .string()
          .required("Code Delivery Order Receipt Outstanding harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportDeliveryOrderReceiveOutstandingService.export(
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
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async stockOpname(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Stock Opname harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const excelFile = await ExportStockOpnameService.export(code);

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
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async adjustmentGoodsIn(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Goods In harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportReportGoodsInService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Goods In #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async adjustmentGoodsOut(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Goods Out harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportGoodsOutService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Goods Out #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async internalTransfer(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Internal Transfer harus ada"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportInternalTransferService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Internal Transfer #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }

  // DONE
  static async allStock(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id gudang tidak boleh kosong");

      const id = await yupSchemaValidation(
        req.params.warehouseId,
        schemaParams
      );

      const excelFile = await ExportAllStockService.export({ warehouseId: id })

      const currentDate = new Date();
      const formattedDate = currentDate
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const fileName = `Current Stock - ${formattedDate}.xlsx`;

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      });
      res.end(excelFile);
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Error export all stock",
        error: error.message,
      });
    }
  }

  // DONE
  static async productRequest(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Product Request harus ada"),
      });
      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      const pdfBuffer = await ExportProductRequestOrderService.export(code);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      res.json({
        status: true,
        data: pdfBase64,
        fileName: `Product Request #${code}.pdf`,
        mimeType: "application/pdf",
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({
        status: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  }
}

module.exports = ExportController;
