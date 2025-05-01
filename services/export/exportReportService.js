const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { applyCellFill, styleExcel } = require("../../helpers/excelHelperStyle");
const { throwValidation } = require("../../helpers/responses");

class ExportReportService {
  static async getReport({ query }) {
    const enumTypeReport = {
      SALES_ORDER: "SALES_ORDER"
    }

    switch (query.reportType) {
      case enumTypeReport.SALES_ORDER:
        return await ExportReportService.getReportSo({ query });

      default:
        throw throwValidation(500, "Tipe Report tidak ditemukan");
    }
  }

  static async getReportSo({ query }) {
    try {
      const { startDate, endDate } = generateFilterDate(
        query.month,
        query.year
      );

      const getDataReportSo = await SalesOrderReportService.getDataReportSo({
        query: { startDate, endDate },
      });

      const workbook = new ExcelJS.Workbook();

      const monthName = new Date(query.year, query.month - 1).toLocaleString(
        "en-US",
        {
          month: "long",
        }
      );

      // Set the worksheet name dynamically
      const sheetName = `Sales_Order_Report_${monthName}_${query.year}`;

      // Sheet 1 For Detail Transaction
      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);
      // Sheet 2 For Accumulation Order Transaction
      const worksheet2 = workbook.addWorksheet(`Perincian ${monthName}`);

      // Freeze the header row in both worksheets
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet2.views = [{ state: 'frozen', ySplit: 1 }];

      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      // Define column headers sheet 1
      const headers = [
        "Tanggal",
        "Pembeli",
        "Nama Barang",
        "Harga Beli",
        "Harga Jual",
        "Quantity",
        "Total Harga Beli",
        "Total Harga Jual",
        "Gain/Loss",
      ];

      const headers2 = ["Tanggal", "Transaksi", "Nominal Transaksi"];

      worksheet.columns = [
        { header: headers[0], key: "tanggal", width: 15 },
        { header: headers[1], key: "pembeli", width: 20 },
        { header: headers[2], key: "namaBarang", width: 30 },
        { header: headers[3], key: "hargaBeli", width: 15 },
        { header: headers[4], key: "hargaJual", width: 15 },
        { header: headers[5], key: "quantity", width: 10 },
        { header: headers[6], key: "totalHargaBeli", width: 15 },
        { header: headers[7], key: "totalHargaJual", width: 15 },
        { header: headers[8], key: "gainLoss", width: 15 },
      ];

      worksheet2.columns = [
        { header: headers2[0], key: "tanggal", width: 15 },
        { header: headers2[1], key: "transaksi", width: 15 },
        { header: headers2[2], key: "nominalTransaksi", width: 20 },
      ];

      // Apply styling to headers Sheet 1
      const headerRow = worksheet.getRow(1);
      headerRow.font = fontBold;
      headerRow.alignment = centerMiddle;

      headerRow.eachCell((cell, colNumber) => {
        cell.border = styleBorder;

        // Apply RED to headers Tanggal → Quantity
        if (colNumber >= 1 && colNumber <= 8) {
          applyCellFill(cell, "FFFFC1C1");
        }

        // Apply BLUE to Gain/Loss
        if (colNumber === 9) {
          applyCellFill(cell, "FFADD8E6");
        }
      });

      // Apply styling to headers Sheet 2
      const headerRow2 = worksheet2.getRow(1);
      headerRow2.font = fontBold;
      headerRow2.alignment = centerMiddle;
      headerRow2.eachCell((cell) => {
        cell.border = styleBorder;
        applyCellFill(cell, "FFFFC1C1");
      });

      let rowIndex = 2; // Start inserting data from row 2

      for (const order of getDataReportSo) {
        const {
          approvedAt,
          Master_Customer,
          Sales_Order_Details,
          totalGainLoss,
          totalModal,
          grandTotalCustomer,
        } = order;

        const startMergeIndex = rowIndex; // Store merge start index
        let endMergeIndex = startMergeIndex + Sales_Order_Details.length - 1; // Calculate end index
        let sumTotalJual = 0;
        let sumTotalBeli = 0;
        for (const detail of Sales_Order_Details) {
          const { Warehouse_Product, modal, price, quantity, gainLoss } =
            detail;

          // Insert Data Row
          worksheet.addRow({
            tanggal: approvedAt,
            pembeli: Master_Customer?.name || "",
            namaBarang: Warehouse_Product?.Master_Product?.name || "",
            hargaBeli: priceFormatWIthCurrency(modal),
            hargaJual: priceFormatWIthCurrency(price),
            quantity,
            totalHargaBeli: priceFormatWIthCurrency(modal * quantity || ""),
            totalHargaJual: priceFormatWIthCurrency(price * quantity || ""),
            gainLoss: priceFormatWIthCurrency(gainLoss || ""), // Keep empty gain/loss but maintain border
          });

          sumTotalBeli += modal * quantity;
          sumTotalJual += price * quantity;

          // Apply Cell Formatting
          const lastRow = worksheet.lastRow;
          lastRow.eachCell((cell, colNumber) => {
            cell.border = styleBorder;

            // Center align numeric columns
            if (colNumber >= 4 && colNumber <= 9) {
              cell.alignment = centerMiddle;
            }
          });

          rowIndex++;
        }

        // Merge 'Tanggal' & 'Pembeli' columns
        worksheet.mergeCells(`A${startMergeIndex}:A${endMergeIndex}`);
        worksheet.mergeCells(`B${startMergeIndex}:B${endMergeIndex}`);
        worksheet.getCell(`A${startMergeIndex}`).alignment = centerMiddle;
        worksheet.getCell(`B${startMergeIndex}`).alignment = centerMiddle;

        // Add Total Row
        const totalRow = worksheet.addRow({
          namaBarang: "TOTAL",
          hargaBeli: priceFormatWIthCurrency(totalModal),
          gainLoss: priceFormatWIthCurrency(totalGainLoss),
          totalHargaBeli: priceFormatWIthCurrency(sumTotalBeli),
          totalHargaJual: priceFormatWIthCurrency(sumTotalJual),
        });

        totalRow.font = fontBold;
        totalRow.eachCell((cell, colNumber) => {
          cell.border = styleBorder;

          // Center align numeric total columns
          if (colNumber >= 4 && colNumber <= 9) {
            cell.alignment = centerMiddle;
            applyCellFill(cell, "FFEE8C");
          }

          // Blue background for Gain/Loss total
          if (colNumber === 9) {
            applyCellFill(cell, "FFADD8E6");
          }
        });

        rowIndex++;

        // Add 2 blank rows for spacing
        worksheet.addRow({});
        worksheet.addRow({});
        rowIndex += 2;

        // Insert Data For Sheet 2
        const sheetRow = worksheet2.addRow({
          tanggal: approvedAt,
          transaksi: Master_Customer?.name || "",
          nominalTransaksi: priceFormatWIthCurrency(grandTotalCustomer),
        });

        sheetRow.font = fontBold;
        sheetRow.eachCell((cell, colNumber) => {
          cell.border = styleBorder;
          cell.alignment = centerMiddle;
          if (colNumber != 3) {
            applyCellFill(cell, "FFFFFF00");
          }
        });
      }

      // Save the file
      const file = await workbook.xlsx.writeBuffer();

      console.log(`Excel report generated: ${query.reportType}`);
      return {
        sheetName,
        file
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportReportService;
