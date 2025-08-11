const ExcelJS = require("exceljs");
const ProductWarehouseService = require("../productWarehouse/ProductWarehouseService");

class ExportAllStockService {
  static async export({ warehouseId }) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile("./template/export/TotalStock.xlsx");

      const getDataAllStock = await ProductWarehouseService.getExportAllStock(
        warehouseId
      );

      // Define worksheet mapping
      const worksheetMapping = {
        "GUDANG GARAM": 1,
        SAMPOERNA: 2,
        DJARUM: 3,
        "BRAND KECIL": 4,
      };

      // Grouping products by company and name
      const groupedData = {};

      // Group products by company
      getDataAllStock.forEach((data) => {
        const key = `${data.companyName.toUpperCase()}||${data.productName}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            companyName: data.companyName.toUpperCase(),
            productName: data.productName,
            KARTON: 0,
            BAL: 0,
            SLOP: 0,
          };
        }
        // Filter by the Unit
        if (["KARTON", "BAL", "SLOP"].includes(data.unitName)) {
          groupedData[key][data.unitName] = data.quantity;
        }
      });
      // Index for start from row 2
      const rowIndexMap = { 1: 2, 2: 2, 3: 2, 4: 2 };

      // loop key to made the row
      Object.values(groupedData).forEach((item, index) => {
        const sheetIndex = worksheetMapping[item.companyName] || 4;
        const worksheet = workbook.getWorksheet(sheetIndex);
        const rowIndex = rowIndexMap[sheetIndex]++;

        worksheet.getCell(`A${rowIndex}`).value =
          item.companyName.toUpperCase();
        worksheet.getCell(`B${rowIndex}`).value = item.productName;
        worksheet.getCell(`C${rowIndex}`).value = item.KARTON;
        worksheet.getCell(`D${rowIndex}`).value = item.BAL;
        worksheet.getCell(`E${rowIndex}`).value = item.SLOP;

        ["A", "B", "C", "D", "E"].forEach((col) => {
          worksheet.getCell(`${col}${rowIndex}`).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Adjust column widths for A and B dynamically based on the longest content
      Object.values(worksheetMapping).forEach((sheetIndex) => {
        const worksheet = workbook.getWorksheet(sheetIndex);
        if (!worksheet) return;
        
        // Auto-fit columns A and B
        worksheet.getColumn(1).width = undefined; // Reset width
        worksheet.getColumn(2).width = undefined; // Reset width
        
        // Calculate optimal width for column A and B
        let maxWidthA = 12; // Minimum width
        let maxWidthB = 12; // Minimum width
        
        // Check all rows including headers
        for (let i = 1; i <= worksheet.rowCount; i++) {
          const cellA = worksheet.getCell(i, 1);
          const cellB = worksheet.getCell(i, 2);
          
          if (cellA.value) {
            const textLength = String(cellA.value).length;
            if (textLength > maxWidthA) {
              maxWidthA = textLength;
            }
          }
          
          if (cellB.value) {
            const textLength = String(cellB.value).length;
            if (textLength > maxWidthB) {
              maxWidthB = textLength;
            }
          }
        }
        
        // Set the calculated widths with some padding
        worksheet.getColumn(1).width = maxWidthA + 3;
        worksheet.getColumn(2).width = maxWidthB + 3;
      });
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportAllStockService;