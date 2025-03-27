const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const path = require("path");
const {
  formatDateFromString,
  formatDate,
} = require("../../helpers/formatDate");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");

class ExportReportService {
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

      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);

      // Define column headers
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

      // Apply styling to headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };

      headerRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Apply RED to headers Tanggal → Quantity
        if (colNumber >= 1 && colNumber <= 8) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFC1C1" },
          }; // Light red
        }

        // Apply BLUE to Gain/Loss
        if (colNumber === 9) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFADD8E6" },
          }; // Light blue
        }
      });

      let rowIndex = 2; // Start inserting data from row 2

      for (const order of getDataReportSo) {
        const {
          approvedAt,
          Master_Customer,
          Sales_Order_Details,
          totalGainLoss,
          totalModal,
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
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

            // Center align numeric columns
            if (colNumber >= 4 && colNumber <= 9) {
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }
          });

          rowIndex++;
        }

        // Merge 'Tanggal' & 'Pembeli' columns
        worksheet.mergeCells(`A${startMergeIndex}:A${endMergeIndex}`);
        worksheet.mergeCells(`B${startMergeIndex}:B${endMergeIndex}`);
        worksheet.getCell(`A${startMergeIndex}`).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        worksheet.getCell(`B${startMergeIndex}`).alignment = {
          vertical: "middle",
          horizontal: "center",
        };

        // Add Total Row
        const totalRow = worksheet.addRow({
          namaBarang: "TOTAL",
          hargaBeli: priceFormatWIthCurrency(totalModal),
          gainLoss: priceFormatWIthCurrency(totalGainLoss),
          totalHargaBeli: priceFormatWIthCurrency(sumTotalBeli),
          totalHargaJual: priceFormatWIthCurrency(sumTotalJual),
        });

        totalRow.font = { bold: true };
        totalRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Center align numeric total columns
          if (colNumber >= 4 && colNumber <= 9) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEE8C" },
            };
          }

          // Blue background for Gain/Loss total
          if (colNumber === 9) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFADD8E6" },
            };
          }
        });

        rowIndex++;

        // Add 2 blank rows for spacing
        worksheet.addRow({});
        worksheet.addRow({});
        rowIndex += 2;
      }

      // Save the file
      const filePath = path.join(__dirname, `${sheetName}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      console.log(`Excel report generated: ${filePath}`);
      return {
        filePath,
        sheetName,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportReportService;
