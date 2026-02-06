const { styleExcel } = require("../../helpers/excelHelperStyle");
const ExcelJS = require("exceljs");

class ExportPointOfSaleService {
  static async generateExcel(data) {
    try {
      const workbook = new ExcelJS.Workbook();

      const worksheet = workbook.addWorksheet("Point Of Sale");
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const { fontBold, centerMiddle } = styleExcel;

      worksheet.columns = [
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Code", key: "code", width: 20 },
        { header: "Status", key: "status", width: 15 },
        { header: "Metode Pembayaran", key: "paymentType", width: 15 },
        { header: "Total Barang", key: "totalItems", width: 15 },
        { header: "Sub Total", key: "subTotal", width: 20 },
        { header: "Discount", key: "totalDiscount", width: 15 },
        { header: "Total Payment", key: "totalPayment", width: 20 },
        { header: "Grand Total", key: "grandTotal", width: 25 },
        { header: "Catatan", key: "notes", width: 20 },
        { header: "Kasir", key: "createdBy", width: 20 },
        { header: "Shift", key: "shiftName", width: 20 },
      ];

      // Apply styling to headers Sheet 1
      const headerRow = worksheet.getRow(1);
      headerRow.font = fontBold;
      headerRow.alignment = centerMiddle;

      for (const pos of data) {
        const paymentType =
          pos.Pos_Transaction_Payment_History &&
          pos.Pos_Transaction_Payment_History.Pos_Payment_Type
            ? pos.Pos_Transaction_Payment_History.Pos_Payment_Type.label
            : "";

        const name = pos.Master_Customer
          ? `${pos.Master_Customer.name}  ${
              pos.Master_Customer.alias ? `(${pos.Master_Customer.alias})` : ""
            }`
          : "";

        const shiftName = pos.Pos_User_Shift && pos.Pos_User_Shift.Master_Shift
          ? pos.Pos_User_Shift.Master_Shift.name
          : "-";

        worksheet.addRow({
          customerName: name,
          code: pos.code,
          paymentType: `${paymentType} ${paymentType == "Cash" ? "" : `- ${pos.Pos_Transaction_Payment_History.Pos_Payment_Type.description || ""}`}`,
          status: pos.status,
          totalItems: pos.totalItems,
          subTotal: pos.subTotal,
          totalDiscount: pos.totalDiscount,
          totalPayment: pos.totalPayment,
          grandTotal: pos.grandTotal,
          notes: pos.notes,
          createdBy: pos.creator.name || "",
          shiftName: shiftName,
        });
      }
      const filePath = `./Report_Point_Of_Sale.xlsx`;

      await workbook.xlsx.writeFile(filePath);

      return filePath;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportPointOfSaleService;