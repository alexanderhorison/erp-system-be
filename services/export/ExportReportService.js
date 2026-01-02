const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const PurchaseOrderReportService = require("../purchaseOrder/PurchaseOrderReportService");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const {
  applyCellFill,
  styleExcel,
  addTo,
} = require("../../helpers/excelHelperStyle");
const { throwValidation } = require("../../helpers/responses");
const DailyCostService = require("../dailyCost/DailyCostService");
const MasterDataEmployeeService = require("../masterData/MasterDataEmployeeService");
const MasterDataUnexpectedCostCategoryService = require("../masterData/MasterDataUnexpectedCostCategoryService");
const { formatDate } = require("../../helpers/formatDate");
const CurrentAssetService = require("../asset/CurrentAssetService");
const { Master_Product, Warehouse_Product } = require("../../models");
const NonCurrentAssetService = require("../asset/NonCurrentAssetService");
const ShortTermService = require("../liabilities/ShortTermService");
const LongTermService = require("../liabilities/LongTermService");
const EquityService = require("../equity/EquityService");
const { REPORT_TYPE } = require("../../helpers/reportType");
const MasterDataCustomerService = require("../masterData/MasterDataCustomerService");
const PointOfSaleService = require("../pointOfSale/PointOfSaleService");

class ExportReportService {
  static async getReport({ query }) {

    switch (query.reportType) {
      case REPORT_TYPE.SALES_ORDER:
        return await ExportReportService.getReportSo({ query });
      case REPORT_TYPE.PURCHASE_ORDER:
        return await ExportReportService.getReportPo({ query });
      case REPORT_TYPE.CUSTOMER:
        return await ExportReportService.getReportDataCustomer({ query });
      case REPORT_TYPE.POS:
        return await PointOfSaleService.runSchedulerReportPos();
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

      // Data for Sheet 1 & 2   
      const getDataReportSo = await SalesOrderReportService.getDataReportSo({
        query: { startDate, endDate },
      });

      // Data for Sheet 3
      const { getDataDailyCost, employeesMaster, unexpectedCostMaster } =
        await ExportReportService.getDailyCostMasterData({
          startDate,
          endDate,
        });

      // Data for sheet 6
      // Format period as YYYY-MM (ensure month has leading zero)
      const formattedMonth = query.month.toString().padStart(2, "0");
      const period = `${query.year}-${formattedMonth}`;

      const asetLancar = await CurrentAssetService.getCurrentAssetByPeriod(
        period
      );

      const asetTidakLancar = await NonCurrentAssetService.getDetailByPeriod(
        `${period}-01`
      );

      const liabilitasJangkaPendek = await ShortTermService.getDetailByPeriod(
        `${period}-01`
      );

      const liabilitasJangkaPanjang = await LongTermService.getDetailByPeriod(
        `${period}-01`
      );

      const ekuitas = await EquityService.getDetailByPeriod(`${period}-01`);

      const workbook = new ExcelJS.Workbook();

      const monthName = new Date(query.year, query.month - 1).toLocaleString(
        "en-US",
        {
          month: "long",
        }
      );

      // Set the worksheet name dynamically
      const sheetName = `Sales_Order_Report_${monthName}_${query.year}`;

      // Initialize data for Sheet 4 (Laporan Laba Rugi Komprehensif)
      let dataSheet4 = {
        pendapatanUsaha: 0,
        bebanPenjualan: 0,
        labaBruto: 0,
        bebanOperasi: 0,
        labaUsaha: 0,
        biayaPengiriman: 0,
      };

      // initialize data formula
      let dataSheet4Formula = {
        pendapatanUsaha: [],
        bebanPenjualan: [],
        labaBruto: [],
        bebanOperasi: [],
        labaUsaha: [],
        biayaPengiriman: [],
        gajiTunjangan: [],
        unexpectedCost: [],
      };

      let dataSheet6Formula = {
        asetLancar: asetLancar,
        asetTidakLancar: asetTidakLancar,
        liabilitasJangkaPendek: liabilitasJangkaPendek,
        liabilitasJangkaPanjang: liabilitasJangkaPanjang,
        ekuitas: ekuitas,
      };

      // Process Data For Sheet 1 & 2
      await ExportReportService.generateSheetReportDetailTransaction({
        workbook,
        monthName,
        getDataReportSo,
        dataSheet4,
        dataSheet4Formula,
      });

      // Process Data For Sheet 3
      let grandUnexpectedCost =
        await ExportReportService.generateSheetReportForDailyCost({
          workbook,
          monthName,
          getDataDailyCost,
          employeesMaster,
          unexpectedCostMaster,
          dataSheet4,
          dataSheet4Formula,
        });

      // Process Data For Sheet 4
      await ExportReportService.generateSheetReportForLabaRugiKomprehensif({
        workbook,
        monthName,
        dataSheet4,
        dataSheet4Formula,
      });

      // Process Data For Sheet 5
      await ExportReportService.generateSheetReportForLabaKomersial({
        workbook,
        monthName,
        dataSheet4,
        unexpectedCostMaster,
        grandUnexpectedCost,
        dataSheet4Formula,
      });

      // Process Data For Sheet 6
      await ExportReportService.generateSheetReportForManagementAset({
        workbook,
        monthName,
        dataSheet6Formula,
      });

      // Save the file
      const file = await workbook.xlsx.writeBuffer();

      console.log(`Excel report generated: ${query.reportType}`);
      return {
        sheetName,
        file,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getDailyCostMasterData(query) {
    try {
      const newQuery = {
        startDate: query.startDate,
        endDate: query.endDate,
        orderBy: "ASC",
      };
      const getDataDailyCost = await DailyCostService.findAll(newQuery);
      const employeesMaster = await MasterDataEmployeeService.findAll({
        active: undefined,
      });
      const unexpectedCostMaster =
        await MasterDataUnexpectedCostCategoryService.findAll({
          active: undefined,
        });

      return {
        getDataDailyCost,
        employeesMaster,
        unexpectedCostMaster,
      };
    } catch (error) {
      throw error;
    }
  }

  // Sheet SO 1 for Catatan Pembelian & Sheet 2 for Perincian
  static async generateSheetReportDetailTransaction({
    workbook,
    monthName,
    getDataReportSo,
    dataSheet4,
    dataSheet4Formula,
  }) {
    try {
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      // Sheet 2 For Accumulation Order Transaction
      const worksheet2 = workbook.addWorksheet(`Perincian ${monthName}`);
      worksheet2.views = [{ state: "frozen", ySplit: 1 }];

      // Define column headers sheet 1
      const headers = [
        "Tanggal",
        "Pembeli",
        "Nama Barang",
        "Harga Beli",
        "Harga Jual",
        "Harga Barter",
        "Quantity",
        "Total Harga Beli",
        "Total Harga Jual",
        "Total Harga Barter",
        "Gain/Loss",
      ];

      const headers2 = ["Tanggal", "Transaksi", "Nominal Transaksi"];

      worksheet.columns = [
        { header: headers[0], key: "tanggal", width: 15 },
        { header: headers[1], key: "pembeli", width: 20 },
        { header: headers[2], key: "namaBarang", width: 30 },
        { header: headers[3], key: "hargaBeli", width: 15 },
        { header: headers[4], key: "hargaJual", width: 15 },
        { header: headers[5], key: "hargaBarter", width: 15 },
        { header: headers[6], key: "quantity", width: 10 },
        { header: headers[7], key: "totalHargaBeli", width: 20 },
        { header: headers[8], key: "totalHargaJual", width: 20 },
        { header: headers[9], key: "totalHargaBarter", width: 20 },
        { header: headers[10], key: "gainLoss", width: 15 },
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

      // Apply styling to headers Sheet 2
      const headerRow2 = worksheet2.getRow(1);
      headerRow2.font = fontBold;
      headerRow2.alignment = centerMiddle;
      headerRow2.eachCell((cell) => {
        cell.border = styleBorder;
        applyCellFill(cell, "FFFFC1C1");
      });

      headerRow.eachCell((cell, colNumber) => {
        cell.border = styleBorder;

        // Apply RED to headers Tanggal → Total Harga Barter (columns 1-10)
        if (colNumber >= 1 && colNumber <= 10) {
          applyCellFill(cell, "FFFFC1C1");
        }

        // Apply BLUE to Gain/Loss (column 11)
        if (colNumber === 11) {
          applyCellFill(cell, "FFADD8E6");
        }
      });

      let rowIndex = 2; // Start inserting data from row 2
      
      // Track all Total Harga Jual and Total Barter cells for summary
      const allTotalHargaJualCells = [];
      const allTotalBarterCells = [];

      // Report for SO Sheet 1
      for (const order of getDataReportSo) {
        const {
          approvedAt,
          Master_Customer,
          Sales_Order_Details,
          Sales_Order_Barter_Details,
          totalGainLoss,
        } = order;

        const customerName = Master_Customer?.alias || Master_Customer?.name || "";
        const orderStartRow = rowIndex;

        // Track GRAND TOTAL only from Sales Order Details (column H - Total Harga Jual)
        let grandTotalSalesOrderFormula = null;
        let salesOrderDetailTotalRow = null; // Store Sales Order Details TOTAL row number
        let sumTotalJual = 0;
        let sumTotalBeli = 0;
        

        // ========== SALES ORDER DETAILS SECTION ==========
        if (Sales_Order_Details && Sales_Order_Details.length > 0) {
          const detailStartRow = rowIndex;

          for (const detail of Sales_Order_Details) {
            const { Warehouse_Product, modal, price, quantity } = detail;

            // Insert Data Row
            const dataRow = worksheet.addRow({
              tanggal: approvedAt,
              pembeli: customerName,
              namaBarang: Warehouse_Product?.Master_Product?.name || "",
              hargaBeli: Number(modal),
              hargaJual: Number(price),
              quantity,
            });

            const rowNumber = dataRow.number;

            worksheet.getCell(`H${rowNumber}`).value = {
              formula: `D${rowNumber}*G${rowNumber}`,
            }; // totalHargaBeli (Harga Beli * Quantity)
            worksheet.getCell(`I${rowNumber}`).value = {
              formula: `E${rowNumber}*G${rowNumber}`,
            }; // totalHargaJual (Harga Jual * Quantity)
            worksheet.getCell(`K${rowNumber}`).value = {
              formula: `I${rowNumber}-H${rowNumber}`,
            }; // gainLoss (Total Harga Jual - Total Harga Beli)

            sumTotalBeli += modal * quantity;
            sumTotalJual += price * quantity;

            // Apply Cell Formatting - Apply borders to ALL columns (A-K)
            for (let col = 1; col <= 11; col++) {
              const cell = dataRow.getCell(col);
              cell.border = styleBorder;

              // Center align numeric columns (D, E, G-K) but not Quantity column
              if ((col >= 4 && col <= 5) || (col >= 8 && col <= 11)) {
                cell.alignment = centerMiddle;
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }

              // Quantity column (G) center align without currency
              if (col === 7) {
                cell.alignment = centerMiddle;
              }
            }

            rowIndex++;
          }

          const detailEndRow = rowIndex - 1;

          // Store TOTAL row reference for GRAND TOTAL
          const totalDetailRowNumber = rowIndex;
          salesOrderDetailTotalRow = totalDetailRowNumber; // Store for later use

          // Add TOTAL row for Sales Order Details
          const totalDetailRow = worksheet.addRow({
            namaBarang: "TOTAL",
            hargaBeli: { formula: `SUM(D${detailStartRow}:D${detailEndRow})` },
            totalHargaBeli: { formula: `SUM(H${detailStartRow}:H${detailEndRow})` },
            totalHargaJual: { formula: `SUM(I${detailStartRow}:I${detailEndRow})` },
            gainLoss: { formula: `SUM(K${detailStartRow}:K${detailEndRow})` },
          });

          // Track for summary: Add Total Harga Jual cell
          allTotalHargaJualCells.push(`I${totalDetailRowNumber}`);

          // Store reference to this TOTAL row for GRAND TOTAL (use column I - Total Harga Jual)
          grandTotalSalesOrderFormula = `I${totalDetailRowNumber}`;

          totalDetailRow.font = fontBold;
          
          // Apply borders to ALL columns (A-K) and yellow fill only to cells with values
          for (let col = 1; col <= 11; col++) {
            const cell = totalDetailRow.getCell(col);
            cell.border = styleBorder;

            if (col >= 4 && col <= 11) {
              cell.alignment = centerMiddle;
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              
              // Only apply yellow fill if cell has a value (formula or number)
              if (cell.value) {
                applyCellFill(cell, "FFEE8C");
              }
            }

            // Blue background for Gain/Loss total (column K)
            if (col === 11 && cell.value) {
              applyCellFill(cell, "FFADD8E6");
            }
          }

          rowIndex++;
        }

        // ========== SALES ORDER BARTER DETAILS SECTION ==========
        if (Sales_Order_Barter_Details && Sales_Order_Barter_Details.length > 0) {
          const barterStartRow = rowIndex;

          // Optimize: Fetch all product names in one query to avoid N+1 problem
          const warehouseProductIds = Sales_Order_Barter_Details.map(detail => detail.Warehouse_Product?.id).filter(Boolean);
          const productNameMap = {};
          
          if (warehouseProductIds.length > 0) {
            const warehouseProducts = await Warehouse_Product.findAll({
              where: { id: warehouseProductIds },
              include: [{
                model: Master_Product,
                attributes: ['name']
              }],
              attributes: ['id']
            });
            
            // Create a map for quick lookup
            warehouseProducts.forEach(wp => {
              productNameMap[wp.id] = wp.Master_Product?.name || "";
            });
          }

          for (const barterDetail of Sales_Order_Barter_Details) {
            const { Warehouse_Product: warehouseProduct, price, quantity } = barterDetail;
            
            // Get product name from the map
            const productName = productNameMap[warehouseProduct?.id] || "";

            // Insert Barter Row - use Harga Barter (column F) and Total Harga Barter (column J)
            const barterRow = worksheet.addRow({
              tanggal: approvedAt,
              pembeli: customerName,
              namaBarang: productName,
              quantity,
            });

            const rowNumber = barterRow.number;

            // Harga Barter in column F
            worksheet.getCell(`F${rowNumber}`).value = Number(price);
            
            // Total Harga Barter in column J (Harga Barter * Quantity)
            worksheet.getCell(`J${rowNumber}`).value = {
              formula: `F${rowNumber}*G${rowNumber}`,
            };

            // Apply Cell Formatting - Apply borders to ALL columns (A-K)
            for (let col = 1; col <= 11; col++) {
              const cell = barterRow.getCell(col);
              cell.border = styleBorder;

              // Center align and format Harga Barter (F) and Total Harga Barter (J)
              if (col === 6 || col === 10) {
                cell.alignment = centerMiddle;
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }

              // Quantity column (G) center align
              if (col === 7) {
                cell.alignment = centerMiddle;
              }
            }

            rowIndex++;
          }

          const barterEndRow = rowIndex - 1;
          const totalBarterRowNumber = rowIndex;

          // Add TOTAL row for Barter Details
          const totalBarterRow = worksheet.addRow({
            namaBarang: "TOTAL",
            hargaBarter: { formula: `SUM(F${barterStartRow}:F${barterEndRow})` }, // Harga Barter total
            totalHargaBarter: { formula: `SUM(J${barterStartRow}:J${barterEndRow})` }, // Total Harga Barter
          });

          // Track for summary: Add Total Barter cell
          allTotalBarterCells.push(`J${totalBarterRowNumber}`);

          totalBarterRow.font = fontBold;
          
          // Apply borders to ALL columns (A-K) and yellow fill only to cells with values
          for (let col = 1; col <= 11; col++) {
            const cell = totalBarterRow.getCell(col);
            cell.border = styleBorder;

            if (col >= 4 && col <= 11) {
              cell.alignment = centerMiddle;
              if (col === 6 || col === 10) {
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }
              
              // Only apply yellow fill if cell has a value
              if (cell.value) {
                applyCellFill(cell, "FFEE8C");
              }
            }
          }

          rowIndex++;
        }

        // ========== GRAND TOTAL ROW ==========
        const grandTotalRow = worksheet.addRow({
          namaBarang: "GRAND TOTAL",
        });

        const grandTotalRowNumber = grandTotalRow.number;

        // Add data for sheet 4
        dataSheet4.pendapatanUsaha += sumTotalJual;
        dataSheet4.bebanPenjualan += sumTotalBeli;
        dataSheet4.labaBruto += Number(totalGainLoss);

        // Reference formulas to GRAND TOTAL row
        if (grandTotalSalesOrderFormula) {
          dataSheet4Formula.pendapatanUsaha.push(
            `'Catatan Pembelian ${monthName}'!${grandTotalSalesOrderFormula}`
          );
        }
        // Reference Sales Order Details TOTAL row (not GRAND TOTAL) for Harga Beli and Gain/Loss
        if (salesOrderDetailTotalRow) {
          dataSheet4Formula.bebanPenjualan.push(
            `'Catatan Pembelian ${monthName}'!H${salesOrderDetailTotalRow}`
          );
          dataSheet4Formula.labaBruto.push(
            `'Catatan Pembelian ${monthName}'!K${salesOrderDetailTotalRow}`
          );
        }

        // Merge cells D to K (columns 4-11) for GRAND TOTAL
        worksheet.mergeCells(`D${grandTotalRowNumber}:K${grandTotalRowNumber}`);
        
        // Set the merged cell value - reference Sales Order Details TOTAL only (column I)
        if (grandTotalSalesOrderFormula) {
          worksheet.getCell(`D${grandTotalRowNumber}`).value = {
            formula: grandTotalSalesOrderFormula,
          };
        }

        grandTotalRow.font = fontBold;
        
        // Apply borders to ALL cells in the row (columns A-K)
        for (let col = 1; col <= 11; col++) {
          const cell = grandTotalRow.getCell(col);
          cell.border = styleBorder;
          
          // Format the merged cell (D-K)
          if (col >= 4 && col <= 11) {
            cell.alignment = centerMiddle;
            cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
          }
        }

        // Merge Tanggal and Pembeli for the entire order
        const orderEndRow = rowIndex;
        if (orderEndRow > orderStartRow) {
          worksheet.mergeCells(`A${orderStartRow}:A${orderEndRow}`);
          worksheet.mergeCells(`B${orderStartRow}:B${orderEndRow}`);
          worksheet.getCell(`A${orderStartRow}`).alignment = centerMiddle;
          worksheet.getCell(`B${orderStartRow}`).alignment = centerMiddle;
        }

        rowIndex++;

        // Add 2 blank rows for spacing
        worksheet.addRow({});
        worksheet.addRow({});
        rowIndex += 2;

        // Insert Data For Sheet 2 - reference GRAND TOTAL
        const sheetRow = worksheet2.addRow({
          tanggal: approvedAt,
          transaksi: customerName,
          nominalTransaksi: {
            formula: `'Catatan Pembelian ${monthName}'!D${grandTotalRowNumber}`,
          },
        });

        sheetRow.font = fontBold;
        sheetRow.eachCell((cell, colNumber) => {
          cell.border = styleBorder;
          cell.alignment = centerMiddle;
          if (colNumber != 3) {
            applyCellFill(cell, "FFFFFF00");
          }

          if (colNumber == 3) {
            cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
          }
        });
      }

      // ========== ADD SUMMARY SECTION AT BOTTOM ==========
      // Add blank row
      worksheet.addRow({});
      rowIndex++;
      
      // Add summary rows
      const summaryTotalHargaJualRow = worksheet.addRow({
        tanggal: "Total Harga Jual",
      });
      
      const summaryTotalBarterRow = worksheet.addRow({
        tanggal: "Total Barter",
      });
      
      const summaryGrandTotalRow = worksheet.addRow({
        tanggal: "Grand Total",
      });

      // ========== UPDATE SUMMARY SECTION FORMULAS ==========
      // Total Harga Jual: Sum all Total Harga Jual cells (column I from all TOTAL rows)
      if (allTotalHargaJualCells.length > 0) {
        summaryTotalHargaJualRow.getCell(2).value = {
          formula: `SUM(${allTotalHargaJualCells.join(",")})`
        };
      }
      
      // Total Barter: Sum all Total Barter cells (column J from all Barter TOTAL rows)
      if (allTotalBarterCells.length > 0) {
        summaryTotalBarterRow.getCell(2).value = {
          formula: `SUM(${allTotalBarterCells.join(",")})`
        };
      }
      
      // Grand Total: Total Harga Jual - Total Barter
      summaryGrandTotalRow.getCell(2).value = {
        formula: `B${summaryTotalHargaJualRow.number}-B${summaryTotalBarterRow.number}`
      };
      
      // Style summary section
      [summaryTotalHargaJualRow, summaryTotalBarterRow, summaryGrandTotalRow].forEach((row, index) => {
        row.getCell(1).font = fontBold; // Column A bold
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(2).alignment = centerMiddle;
        row.getCell(2).numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
        row.getCell(2).font = fontBold;
        
        // Add border to both cells
        row.getCell(1).border = styleBorder;
        row.getCell(2).border = styleBorder;
        
        // Grand Total row styling (blue background)
        if (index === 2) {
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFADD8E6' }
          };
          row.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFADD8E6' }
          };
        }
      });

      return dataSheet4;
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForDailyCost({
    workbook,
    monthName,
    getDataDailyCost,
    employeesMaster,
    unexpectedCostMaster,
    dataSheet4,
    dataSheet4Formula,
  }) {
    try {
      // Sheet 3 For Daily Cost Transaction
      const worksheet3 = workbook.addWorksheet(
        `Pengeluaran Transaksi ${monthName}`
      );

      const { styleBorder, fontBold, centerMiddle } = styleExcel;
      worksheet3.views = [{ state: "frozen", ySplit: 1 }];

      const employeeCols = employeesMaster.flatMap((emp) => [
        { header: `Gaji ${emp.nama}`, key: `emp_${emp.id}_gaji`, width: 15 },
        { header: `Bonus ${emp.nama}`, key: `emp_${emp.id}_bonus`, width: 15 },
        {
          header: `Kasbon ${emp.nama}`,
          key: `emp_${emp.id}_kasbon`,
          width: 15,
        },
      ]);

      const unexpectedKey = [];

      const unexpectedCostCols = unexpectedCostMaster.map((cost) => {
        unexpectedKey.push(`unexpectedCost_${cost.id}`);
        return {
          header: cost.name,
          key: `unexpectedCost_${cost.id}`,
          width: 17,
        };
      });

      worksheet3.columns = [
        { header: "Tanggal", key: "tanggal", width: 15 },
        ...employeeCols,
        { header: "Biaya Tol", key: "tollCost", width: 15 },
        { header: "Biaya Bensin", key: "fuelCost", width: 15 },
        { header: "Uang Jalan", key: "transportAllowance", width: 15 },
        ...unexpectedCostCols,
      ];

      const headerRow3 = worksheet3.getRow(1);
      headerRow3.font = fontBold;
      headerRow3.alignment = centerMiddle;
      headerRow3.eachCell((cell) => {
        cell.border = styleBorder;
        applyCellFill(cell, "FFFFC1C1");
      });

      // REPORT FOR DAILY COST
      const grand = Object.fromEntries(
        worksheet3.columns.map((c) => [c.key, 0])
      );

      const grandUnexpectedCost = {};

      for (const dailyCost of getDataDailyCost) {
        if (dailyCost.costGenerals.length === 0) {
          const rowObj = { tanggal: dailyCost.date };
          dailyCost.costEmployees.forEach((e) => {
            rowObj[`emp_${e.employeeId}_gaji`] = Number(+e.salary || 0);
            rowObj[`emp_${e.employeeId}_bonus`] = Number(+e.bonus || 0);
            rowObj[`emp_${e.employeeId}_kasbon`] = Number(+e.amountDebt || 0);

            addTo(grand, `emp_${e.employeeId}_gaji`, +e.salary || 0);
            addTo(grand, `emp_${e.employeeId}_bonus`, +e.bonus || 0);
            addTo(grand, `emp_${e.employeeId}_kasbon`, +e.amountDebt || 0);
          });

          dailyCost.costUnexpecteds.forEach((u) => {
            const k = `unexpectedCost_${u.categoryId}`;
            rowObj[k] = Number(+u.price || 0);
            addTo(grand, k, +u.price || 0);

            // For Cost Unexpected in Sheet 5
            const value = +u.price || 0;
            if (!grandUnexpectedCost[k]) grandUnexpectedCost[k] = 0;
            grandUnexpectedCost[k] += value; // Accumulate raw number for totals
          });

          const r = worksheet3.addRow(rowObj);
          const colCount = worksheet3.columns.length;

          for (let col = 1; col <= colCount; col++) {
            const cell = r.getCell(col); // makes sure the cell is instantiated
            if (!cell.value) cell.value = 0; // keep it visually empty
            if (col != 1) {
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0'; // format currency
            }
            cell.border = styleBorder; // your existing border style
            cell.alignment = centerMiddle; // your alignment
          }
        } else {
          // Separate by each SO
          const generalsBySO = dailyCost.costGenerals.reduce((acc, cg) => {
            (acc[cg.salesOrderId] = acc[cg.salesOrderId] || []).push(cg);
            return acc;
          }, {});

          const soIds = Object.keys(generalsBySO);
          const startRowIdx = worksheet3.rowCount + 1;
          // loop through each SO
          soIds.forEach((soId, idx) => {
            const rowObj = { tanggal: dailyCost.date };

            // STATIC COST
            let toll = 0,
              fuel = 0,
              transport = 0;
            generalsBySO[soId].forEach((g) => {
              toll += +g.tollCost || 0;
              fuel += +g.fuelCost || 0;
              transport += +g.transportAllowance || 0;
            });
            Object.assign(rowObj, {
              tollCost: Number(toll),
              fuelCost: Number(fuel),
              transportAllowance: Number(transport),
            });

            addTo(grand, "tollCost", toll);
            addTo(grand, "fuelCost", fuel);
            addTo(grand, "transportAllowance", transport);

            dataSheet4.biayaPengiriman +=
              Number(toll) + Number(fuel) + Number(transport);

            if (idx === 0) {
              dailyCost.costEmployees.forEach((e) => {
                rowObj[`emp_${e.employeeId}_gaji`] = Number(+e.salary || 0);
                rowObj[`emp_${e.employeeId}_bonus`] = Number(+e.bonus || 0);
                rowObj[`emp_${e.employeeId}_kasbon`] = Number(
                  +e.amountDebt || 0
                );

                addTo(grand, `emp_${e.employeeId}_gaji`, +e.salary || 0);
                addTo(grand, `emp_${e.employeeId}_bonus`, +e.bonus || 0);
                addTo(grand, `emp_${e.employeeId}_kasbon`, +e.amountDebt || 0);
              });

              dailyCost.costUnexpecteds.forEach((u) => {
                const k = `unexpectedCost_${u.categoryId}`;
                rowObj[k] = Number(+u.price || 0);
                addTo(grand, k, +u.price || 0);

                // For Cost Unexpected in Sheet 5
                const value = +u.price || 0;
                if (!grandUnexpectedCost[k]) grandUnexpectedCost[k] = 0;
                grandUnexpectedCost[k] += value; // Accumulate raw number for totals
              });
            }

            /* ── add row to sheet ────────────────────────────────── */
            const r = worksheet3.addRow(rowObj);
            const colCount = worksheet3.columns.length;

            for (let col = 1; col <= colCount; col++) {
              const cell = r.getCell(col); // makes sure the cell is instantiated
              if (!cell.value) cell.value = 0; // keep it visually empty

              if (col != 1) {
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0'; // format currency
              }
              cell.border = styleBorder; // your existing border style
              cell.alignment = centerMiddle; // your alignment
            }
          });

          /* ── MERGE VERTICAL CELLS (date + repeated cols) ───────── */
          const endRowIdx = worksheet3.rowCount;
          if (endRowIdx > startRowIdx) {
            // merge the Date column
            worksheet3.mergeCells(`A${startRowIdx}:A${endRowIdx}`);

            const mergeKeys = [
              ...employeesMaster.flatMap((e) => [
                `emp_${e.id}_gaji`,
                `emp_${e.id}_bonus`,
                `emp_${e.id}_kasbon`,
              ]),
              ...unexpectedCostMaster.map((u) => `unexpectedCost_${u.id}`),
            ];

            mergeKeys.forEach((k) => {
              const col = worksheet3.getColumn(k);
              if (!col || !col.letter) return; // column might not exist (no data)
              worksheet3.mergeCells(
                `${col.letter}${startRowIdx}:${col.letter}${endRowIdx}`
              );
            });
          }
        }
      }

      /* ───────── TOTAL ROW ───────────────────────────────────────────── */
      const totalRowObj = { tanggal: "TOTAL" };
      const startDataRow = 2; // Data starts at row 2 (after header)
      const endDataRow = worksheet3.lastRow.number;
      let grandTotal = 0;

      worksheet3.columns.forEach((col) => {
        const key = col.key;
        if (key !== "tanggal") {
          totalRowObj[key] = {
            formula: `SUM(${col.letter}${startDataRow}:${col.letter}${endDataRow})`,
          };
        }
      });

      const totalRow = worksheet3.addRow(totalRowObj);
      // For Formula Grand Total
      const totalRowNumber = totalRow.number;

      worksheet3.columns.forEach((col) => {
        const key = col.key;
        const formula = `'Pengeluaran Transaksi ${monthName}'!${col.letter}${totalRowNumber}`;

        if (["tollCost", "fuelCost", "transportAllowance"].includes(key)) {
          dataSheet4Formula.biayaPengiriman.push(formula);
        }
        if (/^emp_\d+_(gaji|bonus|kasbon)$/.test(key)) {
          dataSheet4Formula.gajiTunjangan.push(formula);
        }

        if (unexpectedKey.includes(key)) {
          const dataUnexpected = unexpectedCostCols.find((u) => u.key === key);
          dataSheet4Formula.unexpectedCost.push([
            "",
            dataUnexpected.header,
            { formula: formula },
            0,
            0,
            { formula: formula },
          ]);
        }
      });

      totalRow.eachCell((c, col) => {
        c.alignment = centerMiddle;

        /* thicker border */
        c.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        if (col !== 1) {
          c.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0'; // format currency
        }

        /* green background for every cell in the total row */
        applyCellFill(c, "FF00B050");
      });

      worksheet3.addRow({});

      const allTotalRowObj = { tanggal: "GRAND TOTAL" };

      const allTotalRow = worksheet3.addRow(allTotalRowObj);
      const endColLetter = worksheet3.getColumn(worksheet3.columnCount).letter;

      allTotalRow.getCell("B").value = {
        formula: `SUM(B${totalRowNumber}:${endColLetter}${totalRowNumber})`,
      };
      allTotalRow.font = fontBold; // bold text for emphasis

      // add data for sheet 4
      dataSheet4.bebanOperasi = grandTotal;
      dataSheet4Formula.bebanOperasi.push(
        `'Pengeluaran Transaksi ${monthName}'!B${allTotalRow.number}`
      );
      dataSheet4.labaUsaha =
        Number(dataSheet4.labaBruto) - Number(dataSheet4.bebanOperasi);

      allTotalRow.eachCell((cell, col) => {
        cell.alignment = centerMiddle;
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0'; // format currency

        // Different fill color for ALL TOTAL (orange)
        applyCellFill(cell, "FF00B050");
      });

      return grandUnexpectedCost;
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForLabaRugiKomprehensif({
    workbook,
    monthName,
    dataSheet4,
    dataSheet4Formula,
  }) {
    try {
      // Worksheet 4 for Laporan Laba Rugi Komprehensif
      const worksheet4 = workbook.addWorksheet(
        `Laporan Laba Rugi ${monthName}`,
        {
          views: [{ showGridLines: false }],
        }
      );
      const { fontBold } = styleExcel;

      worksheet4.columns = [
        { width: 3 }, // A (spacing)
        { width: 40 }, // C
        { width: 5 }, // D
        { width: 20 }, // E
        { width: 2 }, // F
      ];
      // --- Header Title ---
      worksheet4.mergeCells("B1:D1");
      worksheet4.getCell("B1").value = "PT Tjahaya Berkat Abadi";
      styleCell(worksheet4.getCell("B1"), {
        fontSize: 16,
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet4.mergeCells("B2:D2");
      worksheet4.getCell("B2").value = "LAPORAN LABA RUGI KOMPREHENSIF";
      styleCell(worksheet4.getCell("B2"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet4.mergeCells("B3:D3");
      worksheet4.getCell("B3").value = formatDate(new Date());
      styleCell(worksheet4.getCell("B3"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet4.mergeCells("B4:D4");
      worksheet4.getCell("B4").value = "(Disajikan dalam Rupiah)";
      styleCell(worksheet4.getCell("B4"), {
        border: { bottom: { style: "thick" } },
        alignmentHorizontal: "left",
      });
      worksheet4.addRow([]);

      let row;

      row = worksheet4.addRow(["", "PENDAPATAN"]);
      row.font = fontBold;
      // row 7
      worksheet4.addRow([
        "",
        "  Pendapatan Usaha",
        "",
        { formula: `SUM(${dataSheet4Formula.pendapatanUsaha.join(",")})` },
      ]);
      styleCell(worksheet4.getCell("D7"), {
        border: { bottom: { style: "medium" } },
        alignmentHorizontal: "right",
        numberFormat: true,
      });

      // row 8
      worksheet4.addRow([
        "",
        "TOTAL PENDAPATAN",
        "",
        { formula: `SUM(${dataSheet4Formula.pendapatanUsaha.join(",")})` },
      ]);
      styleCell(worksheet4.getCell("B8"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D8"), {
        bold: true,
        alignmentHorizontal: "right",
        numberFormat: true,
      });

      worksheet4.addRow([]); // row 10
      worksheet4.addRow([
        "",
        "BEBAN POKOK PENJUALAN",
        "",
        { formula: `SUM(${dataSheet4Formula.bebanPenjualan.join(",")})` },
      ]);
      styleCell(worksheet4.getCell("B10"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D10"), {
        bold: true,
        alignmentHorizontal: "right",
        numberFormat: true,
      });

      worksheet4.addRow([]); // row 12
      worksheet4.addRow([
        "",
        "LABA BRUTO",
        "",
        { formula: `SUM(${dataSheet4Formula.labaBruto.join(",")})` },
      ]);
      styleCell(worksheet4.getCell("B12"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D12"), {
        bold: true,
        numberFormat: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet4.addRow([]);

      row = worksheet4.addRow(["", "BEBAN USAHA"]);
      row.font = fontBold;

      // row 15
      worksheet4.addRow([
        "",
        "  Beban Operasi",
        "",
        { formula: dataSheet4Formula.bebanOperasi[0] },
      ]);
      styleCell(worksheet4.getCell("D15"), {
        numberFormat: true,
        border: { bottom: { style: "medium" } },
        alignmentHorizontal: "right",
      }); // row 16
      worksheet4.addRow([
        "",
        "JUMLAH BEBAN USAHA",
        "",
        { formula: dataSheet4Formula.bebanOperasi[0] },
      ]);
      styleCell(worksheet4.getCell("B16"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D16"), {
        bold: true,
        alignmentHorizontal: "right",
        numberFormat: true,
      });

      worksheet4.addRow([]);

      // row 18
      worksheet4.addRow(["", "LABA USAHA", "", { formula: `SUM(D12-D16)` }]);
      dataSheet4Formula.labaUsaha.push(`'Laporan Laba Rugi ${monthName}'!D18`);
      styleCell(worksheet4.getCell("B18"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D18"), {
        numberFormat: true,
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet4.addRow([]);

      row = worksheet4.addRow(["", "PENDAPATAN/(BEBAN) LAINNYA"]);
      row.font = fontBold;
      // row 21, 22, 23, 24, 25
      worksheet4.addRow(["", "  Selisih Kurs", "", "-"]);
      styleCell(worksheet4.getCell("D21"), { alignmentHorizontal: "right" });
      worksheet4.addRow(["", "  Pendapatan Bunga", "", "-"]);
      styleCell(worksheet4.getCell("D22"), { alignmentHorizontal: "right" });
      worksheet4.addRow(["", "  Beban Bunga", "", "-"]);
      styleCell(worksheet4.getCell("D23"), { alignmentHorizontal: "right" });
      worksheet4.addRow(["", "  Penghasilan/(Beban) Lainnya", "", "-"]);
      styleCell(worksheet4.getCell("D24"), { alignmentHorizontal: "right" });
      worksheet4.addRow(["", "  Final Income Tax", "", "-"]);
      styleCell(worksheet4.getCell("D25"), {
        border: { bottom: { style: "medium" } },
        alignmentHorizontal: "right",
      }); // row 26
      worksheet4.addRow(["", "JUMLAH PENDAPATAN/(BEBAN)", "", "-"]);
      styleCell(worksheet4.getCell("B26"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D26"), {
        bold: true,
        alignmentHorizontal: "right",
      });

      worksheet4.addRow([]);

      // row 28
      worksheet4.addRow(["", "LABA SEBELUM PAJAK", "", { formula: `=D18` }]);
      styleCell(worksheet4.getCell("B28"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D28"), {
        numberFormat: true,
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet4.addRow([]);

      // row 29
      row = worksheet4.addRow(["", "BEBAN PAJAK PENGHASILAN"]);
      row.font = fontBold;
      // row 30, 31
      worksheet4.addRow(["", "  Tahun Berjalan", "", "-"]);
      styleCell(worksheet4.getCell("D31"), { alignmentHorizontal: "right" });
      worksheet4.addRow(["", "  Tangguhan", "", "-"]);
      styleCell(worksheet4.getCell("D32"), {
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" } },
      });

      // row 32
      worksheet4.addRow(["", "JUMLAH BEBAN PAJAK", "", "-"]);
      styleCell(worksheet4.getCell("B33"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D33"), {
        bold: true,
        alignmentHorizontal: "right",
      });

      worksheet4.addRow([]);

      // row 35
      worksheet4.addRow(["", "LABA NETO", "", { formula: `=D28` }]);
      styleCell(worksheet4.getCell("B35"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      styleCell(worksheet4.getCell("D35"), {
        numberFormat: true,
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "double" }, top: { style: "double" } },
      }); // --- Outer Thick Border ---
      for (let r = 1; r <= 36; r++) {
        for (let c = 1; c <= 5; c++) {
          const cell = worksheet4.getCell(r, c);
          if (r === 1)
            cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === 36)
            cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1)
            cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === 5)
            cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }

      // add empty spaces
      worksheet4.addRow({});
      worksheet4.addRow(["", `Jakarta, ${formatDate(new Date())}`]);
      for (let i = 0; i < 4; i++) {
        worksheet4.addRow({});
      }
      const michaelRow = worksheet4.addRow(["", "Michael"]);
      michaelRow.getCell(1).font = { bold: true };

      return "success";
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForLabaKomersial({
    workbook,
    monthName,
    dataSheet4,
    unexpectedCostMaster,
    grandUnexpectedCost,
    dataSheet4Formula,
  }) {
    try {
      const worksheet5 = workbook.addWorksheet("Laba Komersial dan Fiskal", {
        views: [{ showGridLines: false }],
      });
      worksheet5.columns = [
        { width: 3 }, // A (spacing)
        { width: 40 }, // B (Uraian)
        { width: 20 }, // C (Komersial)
        { width: 20 }, // D (Koreksi Fiskal - Beda Waktu)
        { width: 20 }, // E (Koreksi Fiskal - Beda Tetap)
        { width: 20 }, // F (Fiskal)
        { width: 3 }, // G
      ];

      const doubleBorder = {
        top: { style: "double" },
        left: { style: "double" },
        bottom: { style: "double" },
        right: { style: "double" },
      }; // --- Header Title ---

      worksheet5.mergeCells("B1:F1");
      styleCell(worksheet5.getCell("B1"), {
        value: "PT Tjahaya Berkat Abadi",
        fontSize: 16,
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet5.mergeCells("B2:F2");
      styleCell(worksheet5.getCell("B2"), {
        value: "PERHITUNGAN LABA RUGI",
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet5.mergeCells("B3:F3");
      const dateNow = formatDate(new Date());
      styleCell(worksheet5.getCell("B3"), {
        value: dateNow,
        bold: true,
        alignmentHorizontal: "left",
      });

      // --- Blank row for spacing ---
      worksheet5.getRow(4).height = 15; // --- Subtitle Centered ---

      worksheet5.mergeCells("B5:F5");
      styleCell(worksheet5.getCell("B5"), {
        value: "Rekonsiliasi Perhitungan Rugi Laba Komersial dan Fiskal",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
      });

      // --- Header Rows (3-row header) ---
      worksheet5.mergeCells("B7:B9");
      styleCell(worksheet5.getCell("B7"), {
        value: "Uraian",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });

      worksheet5.mergeCells("C7:C8");
      styleCell(worksheet5.getCell("C7"), {
        value: "Komersial",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });
      styleCell(worksheet5.getCell("C9"), {
        value: "Rp.",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });

      worksheet5.mergeCells("D7:E7");
      styleCell(worksheet5.getCell("D7"), {
        value: "Koreksi Fiskal",
        border: doubleBorder,
        bold: true,
        alignmentHorizontal: "center",
      });
      styleCell(worksheet5.getCell("D8"), {
        value: "Beda Waktu",
        border: doubleBorder,
        bold: true,
        alignmentHorizontal: "center",
      });
      styleCell(worksheet5.getCell("D9"), {
        value: "Rp.",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });
      styleCell(worksheet5.getCell("E8"), {
        value: "Beda Tetap",
        border: doubleBorder,
        bold: true,
        alignmentHorizontal: "center",
      });
      styleCell(worksheet5.getCell("E9"), {
        value: "Rp.",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });

      worksheet5.mergeCells("F7:F8");
      styleCell(worksheet5.getCell("F7"), {
        value: "Fiskal",
        border: doubleBorder,
        bold: true,
        alignmentHorizontal: "center",
      });
      styleCell(worksheet5.getCell("F9"), {
        value: "Rp.",
        bold: true,
        alignmentVertical: "middle",
        alignmentHorizontal: "center",
        border: doubleBorder,
        wrapText: true,
      });

      const biayaPengiriman = {
        formula: `SUM(${dataSheet4Formula.biayaPengiriman.join(",")})`,
      };
      const pendapatanUsaha = {
        formula: `SUM(${dataSheet4Formula.pendapatanUsaha.join(",")})`,
      };
      const bebanPenjualan = {
        formula: `SUM(${dataSheet4Formula.bebanPenjualan.join(",")})`,
      };
      const labaBruto = {
        formula: `SUM(${dataSheet4Formula.labaBruto.join(",")})`,
      };
      const bebanOperasi = { formula: dataSheet4Formula.bebanOperasi[0] };
      // C12 is laba kotor and C15 biaya pengiriman + length of unexpectedCostTotalRows + 1
      const labaBersihFormula = {
        formula: `SUM(C12-C${15 + dataSheet4Formula.unexpectedCost.length + 1
          })`,
      };
      const gajiTunjanganFormula = {
        formula: `SUM(${dataSheet4Formula.gajiTunjangan.join(",")})`,
      };
      const data = [
        ["", "Pendapatan Bersih", pendapatanUsaha, 0, 0, pendapatanUsaha],
        ["", "Harga Pokok Penjualan", bebanPenjualan, 0, 0, bebanPenjualan],
        ["", "        LABA KOTOR", labaBruto, 0, 0, labaBruto, "parentheses"],
        ["", "BEBAN USAHA", "", "", "", "", "center"],
        [
          "",
          "Gaji Upah dan Tunjangan lainnya",
          gajiTunjanganFormula,
          0,
          0,
          gajiTunjanganFormula,
        ],
        ["", "Biaya Pengiriman", biayaPengiriman, 0, 0, biayaPengiriman],
        ...dataSheet4Formula.unexpectedCost,
        [
          "",
          "        JUMLAH BEBAN USAHA",
          bebanOperasi,
          0,
          0,
          bebanOperasi,
          "parentheses",
        ],
        [
          "",
          "LABA (RUGI) USAHA",
          labaBersihFormula,
          0,
          0,
          labaBersihFormula,
          "parentheses",
        ],
        ["", "PENDAPATAN (BEBAN) LAIN-LAIN", "", "", "", "", "center"],
        ["", "Pendapatan lain-lain", 0, 0, 0, 0],
        ["", "Pendapatan Bunga", 0, 0, 0, 0],
        ["", "Komisi Penjualan", 0, 0, 0, 0],
        ["", "PENDAPATAN (BEBAN) LAIN-LAIN BERSIH", 0, 0, 0, 0, "center"],
        [
          "",
          "Laba Sebelum Taksiran Pajak Penghasilan",
          labaBersihFormula,
          0,
          0,
          labaBersihFormula,
          "parentheses",
        ],
        ["", "Provision for Income Tax", 0, 0, 0, 0],
        ["", "        TAKSIRAN PAJAK PENGHASILAN", 0, 0, 0, 0],
        [
          "",
          "        LABA BERSIH",
          labaBersihFormula,
          0,
          0,
          labaBersihFormula,
          "parentheses",
        ],
      ];

      let startRow = 10;
      data.forEach((row, idx) => {
        const rowIndex = startRow + idx;
        const isCentered = row[6] === "center";
        const isParentheses = row[6] === "parentheses"; // Check if the last element is 'parentheses'
        const displayRow = isCentered || isParentheses ? row.slice(0, -1) : row; // Remove 'center' if present

        const r = worksheet5.getRow(rowIndex);

        const isUppercase =
          typeof displayRow[1] === "string" &&
          displayRow[1].trim().toUpperCase() === displayRow[1].trim();

        const formattedRow = displayRow.map((val, colIdx) => {
          return val;
        });

        r.values = formattedRow;
        r.height = 20;

        for (let col = 2; col <= displayRow.length; col++) {
          const cell = worksheet5.getCell(rowIndex, col);

          const isFormulaOrNumber =
            typeof displayRow[col - 1] === "number" ||
            (typeof displayRow[col - 1] === "object" &&
              "formula" in displayRow[col - 1]);

          if (isFormulaOrNumber) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            if (isParentheses) {
              cell.numFmt = "(#,##0); (-#,##0); 0";
              cell.font = { bold: true };
            } else {
              cell.numFmt = "#,##0; -#,##0; 0";
            }
          } else if (isCentered && col === 2) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.font = { bold: true };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }

          // if column is uppercase for column 1
          if (col === 2 && isUppercase) {
            cell.font = { bold: true };
          }

          // Apply double border border
          cell.border = doubleBorder;
        }
      });

      // --- Outer Thick Border ---
      const outerStartRow = 1;
      const outerEndRow = startRow + data.length;
      for (let r = outerStartRow; r <= outerEndRow; r++) {
        for (let c = 1; c <= 7; c++) {
          const cell = worksheet5.getCell(r, c);
          if (r === outerStartRow)
            cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === outerEndRow)
            cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1)
            cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === 7)
            cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }

      // add empty spaces
      worksheet5.addRow({});
      worksheet5.addRow(["", `Jakarta, ${dateNow}`]);
      for (let i = 0; i < 4; i++) {
        worksheet5.addRow({});
      }
      const michaelRow = worksheet5.addRow(["", "Michael"]);
      michaelRow.getCell(1).font = { bold: true };

      return "success";
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForManagementAset({
    workbook,
    monthName,
    dataSheet6Formula,
  }) {
    try {
      // Worksheet 6 for Management Aset
      const worksheet6 = workbook.addWorksheet(`Laporan Management Aset`, {
        views: [{ showGridLines: false }],
      });

      const {
        asetLancar,
        asetTidakLancar,
        liabilitasJangkaPanjang,
        liabilitasJangkaPendek,
        ekuitas,
      } = dataSheet6Formula;

      worksheet6.columns = [
        { width: 3 }, // A (spacing)
        { width: 40 }, // B
        { width: 5 }, // C
        { width: 25 }, // D
        { width: 2 }, // E
        { width: 2 }, // F
        { width: 40 }, // G
        { width: 5 }, // H
        { width: 25 }, // I
        { width: 3 }, // J (spacing)
      ];
      // --- Header Title ---
      worksheet6.mergeCells("B1:I1");
      worksheet6.getCell("B1").value = "PT Tjahaya Berkat Abadi";
      styleCell(worksheet6.getCell("B1"), {
        fontSize: 16,
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet6.mergeCells("B2:I2");
      worksheet6.getCell("B2").value = "LAPORAN LABA RUGI KOMPREHENSIF";
      styleCell(worksheet6.getCell("B2"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet6.mergeCells("B3:I3");
      worksheet6.getCell("B3").value = formatDate(new Date());
      styleCell(worksheet6.getCell("B3"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet6.mergeCells("B4:I4");
      worksheet6.getCell("B4").value = "(Disajikan dalam Rupiah)";
      styleCell(worksheet6.getCell("B4"), {
        border: { bottom: { style: "thick" } },
        alignmentHorizontal: "left",
      });

      // Styling for Thick Border (inside the table)
      for (let row = 5; row <= 32; row++) {
        const cell = worksheet6.getCell(`E${row}`);
        styleCell(cell, {
          border: {
            right: { style: "thick" },
          },
        });
      }

      // Styling for border Outside the table
      worksheet6.mergeCells("B33:I33");
      styleCell(worksheet6.getCell("B33"), {
        border: { top: { style: "thick" }, bottom: { style: "thin" } },
      });
      styleCell(worksheet6.getCell("A33"), {
        border: { bottom: { style: "thin" } },
      });
      styleCell(worksheet6.getCell("J33"), {
        border: { bottom: { style: "thin" }, right: { style: "thin" } },
      });
      // J1:J33
      for (let row = 1; row <= 32; row++) {
        const cell = worksheet6.getCell(`J${row}`);
        styleCell(cell, {
          border: {
            right: { style: "thin" },
          },
        });
      }

      worksheet6.getCell("B6").value = "ASET";
      styleCell(worksheet6.getCell("B6"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      worksheet6.getCell("G6").value = "LIABILITAS DAN EKUITAS";
      styleCell(worksheet6.getCell("G6"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      // Worksheet B to D
      // ASET LANCAR
      worksheet6.getCell("B8").value = "ASET LANCAR";
      styleCell(worksheet6.getCell("B8"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      const d8Cell = worksheet6.getCell("D8");
      d8Cell.value = Number(asetLancar.grandTotal) || 0;
      d8Cell.numFmt = "#,##0";
      styleCell(d8Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B9").value = "Kas dan Bank";
      styleCell(worksheet6.getCell("B9"), {
        alignmentHorizontal: "left",
      });
      const d9Cell = worksheet6.getCell("D9");
      d9Cell.value = Number(asetLancar.cashAndBank) || 0;
      d9Cell.numFmt = "#,##0";
      styleCell(d9Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B10").value = "Piutang Usaha";
      styleCell(worksheet6.getCell("B10"), {
        alignmentHorizontal: "left",
      });
      const d10Cell = worksheet6.getCell("D10");
      d10Cell.value = Number(asetLancar.accountsReceivable) || 0;
      d10Cell.numFmt = "#,##0";
      styleCell(d10Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B11").value = "      Pihak Ketiga - Neto";
      styleCell(worksheet6.getCell("B11"), {
        alignmentHorizontal: "left",
      });
      const d11Cell = worksheet6.getCell("D11");
      d11Cell.value = Number(asetLancar.thirdPartyReceivable) || 0;
      d11Cell.numFmt = "#,##0";
      styleCell(d11Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B12").value = "Piutang Lainnya";
      styleCell(worksheet6.getCell("B12"), {
        alignmentHorizontal: "left",
      });
      const d12Cell = worksheet6.getCell("D12");
      d12Cell.value = Number(asetLancar.otherReceivables) || 0;
      d12Cell.numFmt = "#,##0";
      styleCell(d12Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B13").value = "Persediaan";
      styleCell(worksheet6.getCell("B13"), {
        alignmentHorizontal: "left",
      });
      const d13Cell = worksheet6.getCell("D13");
      d13Cell.value = Number(asetLancar.inventory) || 0;
      d13Cell.numFmt = "#,##0";
      styleCell(d13Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B14").value = "Uang Muka";
      styleCell(worksheet6.getCell("B14"), {
        alignmentHorizontal: "left",
      });
      const d14Cell = worksheet6.getCell("D14");
      d14Cell.value = Number(asetLancar.advancePayments) || 0;
      d14Cell.numFmt = "#,##0";
      styleCell(d14Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B15").value = "Pajak Dibayar Dimuka";
      styleCell(worksheet6.getCell("B15"), {
        alignmentHorizontal: "left",
      });
      const d15Cell = worksheet6.getCell("D15");
      d15Cell.value = Number(asetLancar.tax) || 0;
      d15Cell.numFmt = "#,##0";
      styleCell(d15Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B16").value = "Jumlah Aset Lancar";
      styleCell(worksheet6.getCell("B16"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const d16Cell = worksheet6.getCell("D16");
      d16Cell.value = { formula: "SUM(D9:D15)" };
      d16Cell.numFmt = "#,##0";
      styleCell(d16Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      // ASET TIDAK LANCAR
      worksheet6.getCell("B19").value = "ASET TIDAK LANCAR";
      styleCell(worksheet6.getCell("B19"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet6.getCell("B20").value = "Aset Tetap";
      styleCell(worksheet6.getCell("B20"), {
        alignmentHorizontal: "left",
      });
      const d20Cell = worksheet6.getCell("D20");
      d20Cell.value = { formula: "D22+D23+D24" };
      d20Cell.numFmt = "#,##0";
      styleCell(d20Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B21").value = "      Tanah";
      styleCell(worksheet6.getCell("B21"), {
        alignmentHorizontal: "left",
      });
      const d21Cell = worksheet6.getCell("D21");
      d21Cell.value = Number(asetTidakLancar.landValue) || 0;
      d21Cell.numFmt = "#,##0";
      styleCell(d21Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B22").value = "      Total Aset Tetap";
      styleCell(worksheet6.getCell("B22"), {
        alignmentHorizontal: "left",
      });
      const d22Cell = worksheet6.getCell("D22");
      d22Cell.value = Number(asetTidakLancar.totalAsetTetap) || 0;
      d22Cell.numFmt = "#,##0";
      styleCell(d22Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B23").value = "      Penyusutan Tahun Lalu";
      styleCell(worksheet6.getCell("B23"), {
        alignmentHorizontal: "left",
      });
      const d23Cell = worksheet6.getCell("D23");
      d23Cell.value = Number(asetTidakLancar.previousYearDepreciation) || 0;
      d23Cell.numFmt = "#,##0";
      styleCell(d23Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B24").value = "      Penyusutan Tahun Ini";
      styleCell(worksheet6.getCell("B24"), {
        alignmentHorizontal: "left",
      });
      const d24Cell = worksheet6.getCell("D24");
      d24Cell.value = Number(asetTidakLancar.currentYearDepreciation) || 0;
      d24Cell.numFmt = "#,##0";
      styleCell(d24Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B25").value = "Aset Tidak Lancar Lainnya";
      styleCell(worksheet6.getCell("B25"), {
        alignmentHorizontal: "left",
      });
      const d25Cell = worksheet6.getCell("D25");
      d25Cell.value = Number(asetTidakLancar.othersValue) || 0;
      d25Cell.numFmt = "#,##0";
      styleCell(d25Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B26").value = "Investasi Jangka Panjang";
      styleCell(worksheet6.getCell("B26"), {
        alignmentHorizontal: "left",
      });
      const d26Cell = worksheet6.getCell("D26");
      d26Cell.value = Number(asetTidakLancar.longTermInvestment) || 0;
      d26Cell.numFmt = "#,##0";
      styleCell(d26Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("B27").value = "Jumlah Aset Tidak Lancar";
      styleCell(worksheet6.getCell("B27"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const d27Cell = worksheet6.getCell("D27");
      d27Cell.value = { formula: "SUM(D20,D25,D26)" };
      d27Cell.numFmt = "#,##0";
      styleCell(d27Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet6.getCell("B31").value = "JUMLAH ASET";
      styleCell(worksheet6.getCell("B31"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const d31Cell = worksheet6.getCell("D31");
      d31Cell.value = { formula: "D16+D27" };
      d31Cell.numFmt = "#,##0";
      styleCell(d31Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "thick" }, top: { style: "thick" } },
      });

      // Worksheet G to I
      worksheet6.getCell("G8").value = "LIABILITAS JANGKA PENDEK";
      styleCell(worksheet6.getCell("G8"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      const i8Cell = worksheet6.getCell("I8");
      i8Cell.value =
        Number(liabilitasJangkaPendek.totalShortTermLiabilities) || 0;
      i8Cell.numFmt = "#,##0";
      styleCell(i8Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G9").value = "Utang Usaha";
      styleCell(worksheet6.getCell("G9"), {
        alignmentHorizontal: "left",
      });
      const i9Cell = worksheet6.getCell("I9");
      i9Cell.value = Number(liabilitasJangkaPendek.tradePayables) || 0;
      i9Cell.numFmt = "#,##0";
      styleCell(i9Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G10").value = "Utang Bukan Usaha";
      styleCell(worksheet6.getCell("G10"), {
        alignmentHorizontal: "left",
      });
      const i10Cell = worksheet6.getCell("I10");
      i10Cell.value = Number(liabilitasJangkaPendek.nonTradePayables) || 0;
      i10Cell.numFmt = "#,##0";
      styleCell(i10Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G11").value = "Biaya Masih Harus Dibayar";
      styleCell(worksheet6.getCell("G11"), {
        alignmentHorizontal: "left",
      });
      const i11Cell = worksheet6.getCell("I11");
      i11Cell.value = Number(liabilitasJangkaPendek.accruedExpenses) || 0;
      i11Cell.numFmt = "#,##0";
      styleCell(i11Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G12").value = "Utang Pajak";
      styleCell(worksheet6.getCell("G12"), {
        alignmentHorizontal: "left",
      });
      const i12Cell = worksheet6.getCell("I12");
      i12Cell.value = Number(liabilitasJangkaPendek.taxPayables) || 0;
      i12Cell.numFmt = "#,##0";
      styleCell(i12Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G13").value = "Jumlah Liabilitas Jangka Pendek";
      styleCell(worksheet6.getCell("G13"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const i13Cell = worksheet6.getCell("I13");
      i13Cell.value = { formula: "SUM(I9:I12)" };
      i13Cell.numFmt = "#,##0";
      styleCell(i13Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet6.getCell("G15").value = "LIABILITAS JANGKA PANJANG";
      styleCell(worksheet6.getCell("G15"), {
        bold: true,
        alignmentHorizontal: "left",
      });
      const i15Cell = worksheet6.getCell("I15");
      i15Cell.value =
        Number(liabilitasJangkaPanjang.totalLongtermLiabilities) || 0;
      i15Cell.numFmt = "#,##0";
      styleCell(i15Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G16").value = "Pinjaman Kepada Pemegang Saham";
      styleCell(worksheet6.getCell("G16"), {
        alignmentHorizontal: "left",
      });
      const i16Cell = worksheet6.getCell("I16");
      i16Cell.value = Number(liabilitasJangkaPanjang.shareHolderLoans) || 0;
      i16Cell.numFmt = "#,##0";
      styleCell(i16Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G17").value = "Hutang Bank Jangka Panjang";
      styleCell(worksheet6.getCell("G17"), {
        alignmentHorizontal: "left",
      });
      const i17Cell = worksheet6.getCell("I17");
      i17Cell.value = Number(liabilitasJangkaPanjang.longTermBankLoans) || 0;
      i17Cell.numFmt = "#,##0";
      styleCell(i17Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G18").value = "Kewajiban Jangka Panjang Lainnya";
      styleCell(worksheet6.getCell("G18"), {
        alignmentHorizontal: "left",
      });
      const i18Cell = worksheet6.getCell("I18");
      i18Cell.value =
        Number(liabilitasJangkaPanjang.otherLongtermLiabilities) || 0;
      i18Cell.numFmt = "#,##0";
      styleCell(i18Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G19").value = "Jumlah Liabilitas Jangka Panjang";
      styleCell(worksheet6.getCell("G19"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const i19Cell = worksheet6.getCell("I19");
      i19Cell.value = { formula: "SUM(I16:I18)" };
      i19Cell.numFmt = "#,##0";
      styleCell(i19Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet6.getCell("G21").value = "EKUITAS";
      styleCell(worksheet6.getCell("G21"), {
        bold: true,
        alignmentHorizontal: "left",
      });

      worksheet6.getCell("G23").value = "Modal Saham - Nilai Nominal";
      styleCell(worksheet6.getCell("G23"), {
        alignmentHorizontal: "left",
      });
      const i23Cell = worksheet6.getCell("I23");
      i23Cell.value = Number(ekuitas.shareCapital) || 0;
      i23Cell.numFmt = "#,##0";
      styleCell(i23Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G24").value = "Saldo Laba Tahun Lalu";
      styleCell(worksheet6.getCell("G24"), {
        alignmentHorizontal: "left",
      });
      const i24Cell = worksheet6.getCell("I24");
      i24Cell.value = Number(ekuitas.retainedEarningsPreviousYear) || 0;
      i24Cell.numFmt = "(#,##0);(#,##0)";
      styleCell(i24Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G25").value = "Saldo Laba Tahun Berjalan";
      styleCell(worksheet6.getCell("G25"), {
        alignmentHorizontal: "left",
      });
      const i25Cell = worksheet6.getCell("I25");
      i25Cell.value = Number(ekuitas.retainedEarningsCurrentYear) || 0;
      i25Cell.numFmt = "#,##0";
      styleCell(i25Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G26").value = "Saldo Laba";
      styleCell(worksheet6.getCell("G26"), {
        alignmentHorizontal: "left",
      });
      const i26Cell = worksheet6.getCell("I26");
      i26Cell.value = Number(ekuitas.retainedEarningsThisMonth) || 0;
      i26Cell.numFmt = "#,##0";
      styleCell(i26Cell, {
        alignmentHorizontal: "right",
      });

      worksheet6.getCell("G27").value = "Jumlah Ekuitas";
      styleCell(worksheet6.getCell("G27"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const i27Cell = worksheet6.getCell("I27");
      i27Cell.value = { formula: "SUM(I23:I26)" };
      i27Cell.numFmt = "#,##0";
      styleCell(i27Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "medium" }, top: { style: "medium" } },
      });

      worksheet6.getCell("G31").value = "JUMLAH LIABILITAS DAN EKUITAS";
      styleCell(worksheet6.getCell("G31"), {
        alignmentHorizontal: "left",
        bold: true,
      });
      const i31Cell = worksheet6.getCell("I31");
      i31Cell.value = { formula: "I13+I19+I27" };
      i31Cell.numFmt = "#,##0";
      styleCell(i31Cell, {
        bold: true,
        alignmentHorizontal: "right",
        border: { bottom: { style: "thick" }, top: { style: "thick" } },
      });

      styleCell(worksheet6.getCell("B35"), {
        value: `Jakarta, ${formatDate(new Date())}`,
      });
      styleCell(worksheet6.getCell("B40"), { value: `Michael`, bold: true });

      return "success";
    } catch (error) {
      throw error;
    }
  }

  static async getReportDataCustomer({ query }) {
    const customers = await MasterDataCustomerService.getAllCustomerReport()

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Data Customer`);
    const sheetName = "Data Customer";
    const { styleBorder, fontBold, centerMiddle } = styleExcel;


    // Define column headers sheet 1
    const headers = [
      "Nama Customer",
      "Alias",
      "Nomor HP",
      "Email",
      "Alamat",
      "Gender",
      "Pos Customer",
      "Rank",
    ];

    worksheet.columns = [
      { header: headers[0], key: "name", width: 20 },
      { header: headers[1], key: "alias", width: 18 },
      { header: headers[2], key: "phoneNumber", width: 20 },
      { header: headers[3], key: "email", width: 20 },
      { header: headers[4], key: "address", width: 30 },
      { header: headers[5], key: "gender", width: 15 },
      { header: headers[6], key: "isPosCustomer", width: 17 },
      { header: headers[7], key: "rankName", width: 15 },
    ];

    // Apply styling to headers Sheet 1
    const headerRow = worksheet.getRow(1);
    headerRow.font = fontBold;
    headerRow.alignment = centerMiddle;

    for (const detail of customers) {
      // Insert Data Row
      worksheet.addRow({
        name: detail?.name,
        alias: detail?.alias || "",
        phoneNumber: detail?.phoneNumber,
        email: detail?.email,
        address: detail?.address,
        gender: detail?.gender,
        isPosCustomer: detail?.isPosCustomer ? "Ya" : "Tidak",
        rankName: detail?.rankName || "-",
      });
    }
    const file = await workbook.xlsx.writeBuffer();
    console.log(`Excel report generated: ${query.reportType}`);

    return {
      sheetName,
      file
    };
  }

  static async getReportPo({ query }) {
    try {
      const { startDate, endDate } = generateFilterDate(
        query.month,
        query.year
      );

      // Data for Purchase Order Report   
      const getDataReportPo = await PurchaseOrderReportService.getDataReportPo({
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
      const sheetName = `Purchase_Order_Report_${monthName}_${query.year}`;

      // Process Data For Sheet 1 - Catatan Pembelian
      await ExportReportService.generateSheetPurchaseOrderDetailTransaction({
        workbook,
        monthName,
        getDataReportPo,
      });

      // Save the file
      const file = await workbook.xlsx.writeBuffer();

      console.log(`Excel report generated: ${query.reportType}`);
      return {
        sheetName,
        file,
      };
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetPurchaseOrderDetailTransaction({
    workbook,
    monthName,
    getDataReportPo,
  }) {
    try {
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      // Define column headers
      const headers = [
        "Tanggal",
        "Vendor",
        "Nama Barang",
        "Harga Beli",
        "Harga Modal",
        "Harga Barter",
        "Quantity",
        "Total Harga Beli",
        "Total Harga Modal",
        "Total Harga Barter",
        "Gain/Loss",
      ];

      worksheet.columns = [
        { header: headers[0], key: "tanggal", width: 15 },
        { header: headers[1], key: "vendor", width: 20 },
        { header: headers[2], key: "namaBarang", width: 30 },
        { header: headers[3], key: "hargaBeli", width: 15 },
        { header: headers[4], key: "hargaModal", width: 15 },
        { header: headers[5], key: "hargaBarter", width: 15 },
        { header: headers[6], key: "quantity", width: 10 },
        { header: headers[7], key: "totalHargaBeli", width: 20 },
        { header: headers[8], key: "totalHargaModal", width: 20 },
        { header: headers[9], key: "totalHargaBarter", width: 20 },
        { header: headers[10], key: "gainLoss", width: 15 },
      ];

      // Apply styling to headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = fontBold;
      headerRow.alignment = centerMiddle;

      headerRow.eachCell((cell, colNumber) => {
        cell.border = styleBorder;

        // Apply RED to headers Tanggal → Total Harga Barter (columns 1-10)
        if (colNumber >= 1 && colNumber <= 10) {
          applyCellFill(cell, "FFFFC1C1");
        }

        // Apply BLUE to Gain/Loss (column 11)
        if (colNumber === 11) {
          applyCellFill(cell, "FFADD8E6");
        }
      });

      let rowIndex = 2; // Start inserting data from row 2

      // Track all Total Harga Beli and Total Barter cells for summary
      const allTotalHargaBeliCells = [];
      const allTotalBarterCells = [];

      // Report for Purchase Order
      for (const order of getDataReportPo) {
        const {
          approvedAt,
          Master_Vendor,
          Purchase_Order_Details,
          Purchase_Order_Barter_Details,
        } = order;

        const vendorName = Master_Vendor?.name || "";
        const orderStartRow = rowIndex;

        // Track GRAND TOTAL only from Purchase Order Details (column H - Total Harga Beli)
        let grandTotalPurchaseOrderFormula = null;
        let grandTotalBarterFormula = null; // Track barter total for this PO
        let purchaseOrderDetailTotalRow = null; // Store Purchase Order Details TOTAL row number

        // ========== PURCHASE ORDER DETAILS SECTION ==========
        if (Purchase_Order_Details && Purchase_Order_Details.length > 0) {
          const detailStartRow = rowIndex;

          for (const detail of Purchase_Order_Details) {
            const { Warehouse_Product, price, quantity } = detail;

            // Insert Data Row (Non-Barter: hanya Harga Beli dan Total Harga Beli)
            const dataRow = worksheet.addRow({
              tanggal: approvedAt,
              vendor: vendorName,
              namaBarang: Warehouse_Product?.Master_Product?.name || "",
              hargaBeli: Number(price) || 0,
              quantity: Number(quantity) || 0,
            });

            const rowNumber = dataRow.number;

            // totalHargaBeli (Harga Beli * Quantity) - column H
            worksheet.getCell(`H${rowNumber}`).value = {
              formula: `D${rowNumber}*G${rowNumber}`,
            };

            // Apply Cell Formatting - Apply borders to ALL columns (A-K)
            for (let col = 1; col <= 11; col++) {
              const cell = dataRow.getCell(col);
              cell.border = styleBorder;

              // Center align and format Harga Beli (D) and Total Harga Beli (H)
              if (col === 4 || col === 8) {
                cell.alignment = centerMiddle;
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }

              // Quantity column (G) center align without currency
              if (col === 7) {
                cell.alignment = centerMiddle;
              }
            }

            rowIndex++;
          }

          const detailEndRow = rowIndex - 1;

          // Store TOTAL row reference for GRAND TOTAL
          const totalDetailRowNumber = rowIndex;
          purchaseOrderDetailTotalRow = totalDetailRowNumber; // Store for later use

          // Add TOTAL row for Purchase Order Details (Non-Barter)
          const totalDetailRow = worksheet.addRow({
            namaBarang: "TOTAL",
            hargaBeli: { formula: `SUM(D${detailStartRow}:D${detailEndRow})` },
            totalHargaBeli: { formula: `SUM(H${detailStartRow}:H${detailEndRow})` },
          });

          // Track for summary: Add Total Harga Beli cell
          allTotalHargaBeliCells.push(`H${totalDetailRowNumber}`);

          // Store reference to this TOTAL row for GRAND TOTAL (use column H - Total Harga Beli)
          grandTotalPurchaseOrderFormula = `H${totalDetailRowNumber}`;

          totalDetailRow.font = fontBold;

          // Apply borders to ALL columns (A-K) and yellow fill only to cells with values
          for (let col = 1; col <= 11; col++) {
            const cell = totalDetailRow.getCell(col);
            cell.border = styleBorder;

            // Format and fill hanya untuk Harga Beli (D) dan Total Harga Beli (H)
            if (col === 4 || col === 8) {
              cell.alignment = centerMiddle;
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';

              // Only apply yellow fill if cell has a value
              if (cell.value) {
                applyCellFill(cell, "FFEE8C");
              }
            }
          }

          rowIndex++;
        }

        // ========== PURCHASE ORDER BARTER DETAILS SECTION ==========
        if (Purchase_Order_Barter_Details && Purchase_Order_Barter_Details.length > 0) {
          const barterStartRow = rowIndex;

          // Collect all unique productIds from barter details
          const productIds = [...new Set(
            Purchase_Order_Barter_Details
              .map(detail => detail.Warehouse_Product?.productId)
              .filter(Boolean)
          )];

          // Fetch Master_Product manually for deleted products
          const productMap = {};
          if (productIds.length > 0) {
            const products = await Master_Product.findAll({
              where: { id: productIds },
              attributes: ['id', 'name'],
              paranoid: false, // Include soft-deleted products
            });

            products.forEach(product => {
              productMap[product.id] = product.name;
            });
          }

          for (const barterDetail of Purchase_Order_Barter_Details) {
            const { Warehouse_Product: warehouseProduct, modal, price, quantity } = barterDetail;

            // Get product name from manual fetch or from include
            const productId = warehouseProduct?.productId;
            const productName = productMap[productId] ||
              warehouseProduct?.Master_Product?.name ||
              "";

            // Insert Barter Row - Harga Modal (E), Harga Barter (F), Total Modal (I), Total Barter (J), Gain/Loss (K)
            const barterRow = worksheet.addRow({
              tanggal: approvedAt,
              vendor: vendorName,
              namaBarang: productName,
              quantity: Number(quantity) || 0,
            });

            const rowNumber = barterRow.number;

            // Harga Modal in column E (modal dari PO Barter = harga jual SO)
            worksheet.getCell(`E${rowNumber}`).value = Number(modal) || 0;

            // Harga Barter in column F
            worksheet.getCell(`F${rowNumber}`).value = Number(price) || 0;

            // Total Harga Modal in column I (Harga Modal * Quantity)
            worksheet.getCell(`I${rowNumber}`).value = {
              formula: `E${rowNumber}*G${rowNumber}`,
            };

            // Total Harga Barter in column J (Harga Barter * Quantity)
            worksheet.getCell(`J${rowNumber}`).value = {
              formula: `F${rowNumber}*G${rowNumber}`,
            };

            // Gain/Loss in column K (Total Harga Barter - Total Harga Modal)
            worksheet.getCell(`K${rowNumber}`).value = {
              formula: `J${rowNumber}-I${rowNumber}`,
            };

            // Apply Cell Formatting - Apply borders to ALL columns (A-K)
            for (let col = 1; col <= 11; col++) {
              const cell = barterRow.getCell(col);
              cell.border = styleBorder;

              // Center align and format Harga Modal (E), Harga Barter (F), Total Modal (I), Total Barter (J)
              if (col === 5 || col === 6 || col === 9 || col === 10) {
                cell.alignment = centerMiddle;
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }

              // Gain/Loss (K) - blue background
              if (col === 11) {
                cell.alignment = centerMiddle;
                cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              }

              // Quantity column (G) center align without currency
              if (col === 7) {
                cell.alignment = centerMiddle;
              }
            }

            rowIndex++;
          }

          const barterEndRow = rowIndex - 1;
          const totalBarterRowNumber = rowIndex;

          // Add TOTAL row for Barter Details (PO)
          const totalBarterRow = worksheet.addRow({
            namaBarang: "TOTAL",
            hargaModal: { formula: `SUM(E${barterStartRow}:E${barterEndRow})` }, // Harga Modal total
            hargaBarter: { formula: `SUM(F${barterStartRow}:F${barterEndRow})` }, // Harga Barter total
            totalHargaModal: { formula: `SUM(I${barterStartRow}:I${barterEndRow})` }, // Total Harga Modal
            totalHargaBarter: { formula: `SUM(J${barterStartRow}:J${barterEndRow})` }, // Total Harga Barter
            gainLoss: { formula: `J${totalBarterRowNumber}-I${totalBarterRowNumber}` }, // Gain/Loss = Total Barter - Total Modal
          });

          // Track for summary: Add Total Barter cell (PO)
          allTotalBarterCells.push(`J${totalBarterRowNumber}`);

          // Store reference for GRAND TOTAL of this PO
          grandTotalBarterFormula = `J${totalBarterRowNumber}`;

          totalBarterRow.font = fontBold;

          // Apply borders to ALL columns (A-K) and yellow fill only to cells with values
          for (let col = 1; col <= 11; col++) {
            const cell = totalBarterRow.getCell(col);
            cell.border = styleBorder;

            // Format untuk Harga Modal (E), Harga Barter (F), Total Modal (I), Total Barter (J)
            if (col === 5 || col === 6 || col === 9 || col === 10) {
              cell.alignment = centerMiddle;
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';

              // Only apply yellow fill if cell has a value
              if (cell.value) {
                applyCellFill(cell, "FFEE8C");
              }
            }

            // Gain/Loss (K) - blue background
            if (col === 11 && cell.value) {
              cell.alignment = centerMiddle;
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
              applyCellFill(cell, "FFADD8E6");
            }
          }

          rowIndex++;
        }

        // ========== GRAND TOTAL ROW ==========
        const grandTotalRow = worksheet.addRow({
          namaBarang: "GRAND TOTAL",
        });

        const grandTotalRowNumber = grandTotalRow.number;

        // Merge cells D to K (columns 4-11) for GRAND TOTAL
        worksheet.mergeCells(`D${grandTotalRowNumber}:K${grandTotalRowNumber}`);

        // GRAND TOTAL = Total Harga Beli - Total Harga Barter
        if (grandTotalPurchaseOrderFormula && grandTotalBarterFormula) {
          // Ada keduanya: non-barter dan barter
          worksheet.getCell(`D${grandTotalRowNumber}`).value = {
            formula: `${grandTotalPurchaseOrderFormula}-${grandTotalBarterFormula}`,
          };
        } else if (grandTotalPurchaseOrderFormula) {
          // Hanya non-barter
          worksheet.getCell(`D${grandTotalRowNumber}`).value = {
            formula: grandTotalPurchaseOrderFormula,
          };
        } else if (grandTotalBarterFormula) {
          // Hanya barter (negative karena kita kasih barang ke vendor)
          worksheet.getCell(`D${grandTotalRowNumber}`).value = {
            formula: `-${grandTotalBarterFormula}`,
          };
        }

        grandTotalRow.font = fontBold;

        // Apply borders to ALL cells in the row (columns A-K)
        for (let col = 1; col <= 11; col++) {
          const cell = grandTotalRow.getCell(col);
          cell.border = styleBorder;

          // Format the merged cell (D-K)
          if (col >= 4 && col <= 11) {
            cell.alignment = centerMiddle;
            cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
          }
        }

        // Merge Tanggal and Vendor for the entire order
        const orderEndRow = rowIndex;
        if (orderEndRow > orderStartRow) {
          worksheet.mergeCells(`A${orderStartRow}:A${orderEndRow}`);
          worksheet.mergeCells(`B${orderStartRow}:B${orderEndRow}`);
          worksheet.getCell(`A${orderStartRow}`).alignment = centerMiddle;
          worksheet.getCell(`B${orderStartRow}`).alignment = centerMiddle;
        }

        rowIndex++;

        // Add 2 blank rows for spacing
        worksheet.addRow({});
        worksheet.addRow({});
        rowIndex += 2;
      }

      // ========== ADD SUMMARY SECTION AT BOTTOM ==========
      // Add blank row
      worksheet.addRow({});
      rowIndex++;

      // Add summary rows
      const summaryTotalHargaBeliRow = worksheet.addRow({
        tanggal: "Total Harga Beli",
      });

      const summaryTotalBarterRow = worksheet.addRow({
        tanggal: "Total Barter",
      });

      const summaryGrandTotalRow = worksheet.addRow({
        tanggal: "Grand Total",
      });

      // ========== UPDATE SUMMARY SECTION FORMULAS ==========
      // Total Harga Beli: Sum all Total Harga Beli cells (column H from all TOTAL rows)
      if (allTotalHargaBeliCells.length > 0) {
        summaryTotalHargaBeliRow.getCell(2).value = {
          formula: `SUM(${allTotalHargaBeliCells.join(",")})`
        };
      }

      // Total Barter: Sum all Total Barter cells (column J from all Barter TOTAL rows)
      if (allTotalBarterCells.length > 0) {
        summaryTotalBarterRow.getCell(2).value = {
          formula: `SUM(${allTotalBarterCells.join(",")})`
        };
      }

      // Grand Total: Total Harga Beli - Total Barter
      summaryGrandTotalRow.getCell(2).value = {
        formula: `B${summaryTotalHargaBeliRow.number}-B${summaryTotalBarterRow.number}`
      };

      // Style summary section
      [summaryTotalHargaBeliRow, summaryTotalBarterRow, summaryGrandTotalRow].forEach((row, index) => {
        row.getCell(1).font = fontBold; // Column A bold
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(2).alignment = centerMiddle;
        row.getCell(2).numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
        row.getCell(2).font = fontBold;

        // Add border to both cells
        row.getCell(1).border = styleBorder;
        row.getCell(2).border = styleBorder;

        // Grand Total row styling (blue background)
        if (index === 2) {
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFADD8E6' }
          };
          row.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFADD8E6' }
          };
        }
      });

    } catch (error) {
      throw error;
    }
  }
}

function styleCell(cell, options = {}) {
  if (options.value) cell.value = options.value;
  if (options.bold || options.fontSize) {
    cell.font = {
      ...(options.bold && { bold: true }),
      ...(options.fontSize && { size: options.fontSize }),
    };
  }
  if (
    options.alignmentHorizontal ||
    options.alignmentVertical ||
    options.wrapText
  ) {
    cell.alignment = {
      ...(options.alignmentHorizontal && {
        horizontal: options.alignmentHorizontal,
      }),
      ...(options.alignmentVertical && { vertical: options.alignmentVertical }),
      ...(options.wrapText && { wrapText: options.wrapText }),
    };
  }
  if (options.border) cell.border = options.border;
  if (options.rupiahFormat) cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
  if (options.numberFormat) cell.numFmt = "#,##0; -#,##0; 0";
}

module.exports = ExportReportService;
