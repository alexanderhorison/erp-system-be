const ExcelJS = require("exceljs");
const StockOpnameService = require("../stockOpname/StockOpnameService");


class ExportStockOpnameService {
  static async export(code) {
    try {
      const data = await StockOpnameService.getDetailByCode(code);

      if (!data) {
        throw { code: 404, message: "Data not found" };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Stock Opname");

      worksheet.getColumn("A").width = 35;
      worksheet.getColumn("B").width = 35;
      worksheet.getColumn("C").width = 15;
      worksheet.getColumn("D").width = 15;
      worksheet.getColumn("E").width = 15;
      worksheet.getColumn("F").width = 15;
      worksheet.getColumn("G").width = 15;
      worksheet.getColumn("H").width = 15;

      // Metadata (Column A)
      const metadata = [
        { key: `Stock Opname Date`, value: data.opnameDate },
        { key: `Stock Opname Code`, value: data.code },
        { key: `Status`, value: data.status },
        { key: `Warehouse Name`, value: data.warehouseName },
        { key: `Creator Name`, value: data.creatorName },
        { key: `Notes`, value: data.notes },
      ];

      metadata.forEach((item, index) => {
        worksheet.addRow([item.key, item?.value || ""]);
      });

      // FOR SPACE
      worksheet.addRow([""]);

      // Headers in Row 9
      const headers = [
        "Product Name",
        "Company Name",
        "Rack Name",
        "Unit Name",
        "System Stock",
        "Actual Stock",
        "Different",
        "Adjustment",
      ];

      const headerRow = worksheet.addRow(headers);

      // Set border and fill for headers
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "889ff2" }, // Biru muda
        };

        // Cek kolom pertama dan terakhir untuk border tebal
        const isFirstCol = colNumber === 1;
        const isLastCol = colNumber === headers.length;

        cell.border = {
          top: { style: "thick", color: { argb: "000000" } }, // Atas tebal
          bottom: { style: "thick", color: { argb: "000000" } }, // Bawah tebal
          left: {
            style: isFirstCol ? "thick" : "thin",
            color: { argb: "000000" },
          }, // Kiri tebal cuma di kolom pertama
          right: {
            style: isLastCol ? "thick" : "thin",
            color: { argb: "000000" },
          }, // Kanan tebal cuma di kolom terakhir
        };

        cell.font = {
          bold: true,
          color: { argb: "000000" },
        };
      });

      // Data in Column C
      data.listProduct.forEach((product, index) => {
        const row = worksheet.addRow([
          product.productName,
          product.companyName,
          product.rackName,
          product.unitName,
          product.systemStock,
          product.actualStock,
          product.diff,
          product.isAdjustment ? "Yes" : "No",
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "000000" } }, // Biru muda
            left: { style: "thin", color: { argb: "000000" } }, // Biru muda
            bottom: { style: "thin", color: { argb: "000000" } }, // Biru muda
            right: { style: "thin", color: { argb: "000000" } }, // Biru muda
          };
        });
      });

      for (let col = 1; col <= 2; col++) {
        worksheet.getColumn(col).alignment = { horizontal: "left" };
      }

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportStockOpnameService;