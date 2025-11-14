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
        ip: printer.value_json.ip,
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

  static async healthCheckSinglePrinter(req, res) {
    try {
      const printerServerSetting = await ConfigService.get({
        query: {
          key: "PRINTER_SERVER",
        },
      });
      const { ip, name } = req.body;

      const printerServerUrl = printerServerSetting?.value_json.ip;

      const response = await fetch(`${printerServerUrl}/printer-check/single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip, name }),
      });

      const result = await response.json();
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error during single printer health check:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during single printer health check.",
      });
    }
  }

  static async testPrint(req, res) {
    try {
      const printerServerSetting = await ConfigService.get({
        query: {
          key: "PRINTER_SERVER",
        },
      });
      const { ip, name } = req.body;

      let content = `
    ----------------------------------------
            PRINTER TEST PRINT          
    ----------------------------------------
                
      Printer Name: ${name.padEnd(19)}
      IP Address  : ${ip.padEnd(19)}
                
      Status      : CONNECTED           
      Test Date   : ${new Date().toLocaleString("id-ID").padEnd(19)}
                
    ----------------------------------------
          Test Print Successful!         
    ----------------------------------------`;
      content += `\n\n\n\n\n\n\x1d\x56\x00`; // Form feed and cut command

      const printServerUrl = `${printerServerSetting.value_json.ip}/print-pos-api/print-file`;

      const printPayload = {
        buffer: content,
        printerSetting: {
          ip,
        },
      };

      const response = await fetch(printServerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printPayload),
      });
      const result = await response.json();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error during test print:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during test print.",
      });
    }
  }
}

module.exports = PrinterHealthCheckController;
