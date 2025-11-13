const ConfigService = require("../../services/config/configService");

class PrinterHealthCheckController {
  static async healthCheckAllPrinters(req, res) {
    try {
      const printerServerSetting = await ConfigService.get({
        query: {
          key: "PRINTER_SERVER",
        },
      });

      const listPrinter = await ConfigService.getAllConfig({
        query: {
          category: "PRINTER",
        },
      });

      const mappingPrinter = listPrinter.map((printer) => ({
        ip: printer.value_json.printerHost,
        name: printer.description,
      }));

      const printerServerUrl = printerServerSetting?.value_json.ip;

      const response = await fetch(`${printerServerUrl}/printer-check/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mappingPrinter),
      });
      const result = await response.json();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error during printer health check:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during printer health check.",
      });
    }
  }
}

module.exports = PrinterHealthCheckController;
