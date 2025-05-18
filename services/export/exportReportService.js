const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { applyCellFill, styleExcel, addTo } = require("../../helpers/excelHelperStyle");
const { throwValidation } = require("../../helpers/responses");
const DailyCostService = require("../dailyCost/DailyCostService");
const MasterDataEmployeeService = require("../masterData/MasterDataEmployeeService");
const MasterDataUnexpectedCostCategoryService = require("../masterData/MasterDataUnexpectedCostCategoryService");

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

      const {
        getDataDailyCost,
        employeesMaster,
        unexpectedCostMaster
      } =
        await ExportReportService.getDailyCostMasterData();

      // Set the worksheet name dynamically
      const sheetName = `Sales_Order_Report_${monthName}_${query.year}`;

      // Sheet 1 For Detail Transaction
      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);
      // Sheet 2 For Accumulation Order Transaction
      const worksheet2 = workbook.addWorksheet(`Perincian ${monthName}`);
      // Sheet 3 For Daily Cost Transaction
      const worksheet3 = workbook.addWorksheet(`Pengeluaran Transaksi ${monthName}`);

      // Freeze the header row in both worksheets
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet2.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet3.views = [{ state: 'frozen', ySplit: 1 }];

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

      const employeeCols = employeesMaster.flatMap(emp => ([
        { header: `Gaji ${emp.nama}`, key: `emp_${emp.id}_gaji`, width: 15 },
        { header: `Bonus ${emp.nama}`, key: `emp_${emp.id}_bonus`, width: 15 },
      ]));

      const unexpectedCostCols = unexpectedCostMaster.map(cost => ({
        header: cost.name,
        key: `unexpectedCost_${cost.id}`,
        width: 17,
      }));


      worksheet3.columns = [
        { header: 'Tanggal', key: "tanggal", width: 15 },
        ...employeeCols,
        { header: 'Biaya Tol', key: 'tollCost', width: 15 },
        { header: 'Biaya Bensin', key: 'fuelCost', width: 15 },
        { header: 'Uang Jalan', key: 'transportAllowance', width: 15 },
        ...unexpectedCostCols,
      ]

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

      const headerRow3 = worksheet3.getRow(1);
      headerRow3.font = fontBold;
      headerRow3.alignment = centerMiddle;
      headerRow3.eachCell((cell) => {
        cell.border = styleBorder;
        applyCellFill(cell, "FFFFC1C1");
      });

      let rowIndex = 2; // Start inserting data from row 2

      // Report for SO
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

      // REPORT FOR DAILY COST
      const grand = Object.fromEntries(
        worksheet3.columns.map(c => [c.key, 0])
      );

      for (const dailyCost of getDataDailyCost) {
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
          let toll = 0, fuel = 0, transport = 0;
          generalsBySO[soId].forEach(g => {
            toll += +g.tollCost || 0;
            fuel += +g.fuelCost || 0;
            transport += +g.transportAllowance || 0;
          });
          Object.assign(rowObj, {
            tollCost: priceFormatWIthCurrency(toll),
            fuelCost: priceFormatWIthCurrency(fuel),
            transportAllowance: priceFormatWIthCurrency(transport)
          });

          addTo(grand, 'tollCost', toll);
          addTo(grand, 'fuelCost', fuel);
          addTo(grand, 'transportAllowance', transport);

          if (idx === 0) {
            dailyCost.costEmployees.forEach(e => {
              rowObj[`emp_${e.employeeId}_gaji`] =
                priceFormatWIthCurrency(+e.salary || 0);
              rowObj[`emp_${e.employeeId}_bonus`] =
                priceFormatWIthCurrency(+e.bonus || 0);

              addTo(grand, `emp_${e.employeeId}_gaji`, +e.salary || 0);
              addTo(grand, `emp_${e.employeeId}_bonus`, +e.bonus || 0);
            });

            dailyCost.costUnexpecteds.forEach(u => {
              const k = `unexpectedCost_${u.categoryId}`;
              rowObj[k] = priceFormatWIthCurrency(+u.price || 0);
              addTo(grand, k, +u.price || 0);
            });
          }

          /* ── add row to sheet ────────────────────────────────── */
          const r = worksheet3.addRow(rowObj);
          const colCount = worksheet3.columns.length;

          for (let col = 1; col <= colCount; col++) {
            const cell = r.getCell(col);            // makes sure the cell is instantiated
            if (cell.value === undefined) cell.value = '';  // keep it visually empty

            cell.border = styleBorder;           // your existing border style
            cell.alignment = centerMiddle;          // your alignment
          }
        });

        /* ── MERGE VERTICAL CELLS (date + repeated cols) ───────── */
        const endRowIdx = worksheet3.rowCount;
        if (endRowIdx > startRowIdx) {
          // merge the Date column
          worksheet3.mergeCells(`A${startRowIdx}:A${endRowIdx}`);

          const mergeKeys = [
            ...employeesMaster.flatMap(e => [`emp_${e.id}_gaji`, `emp_${e.id}_bonus`]),
            ...unexpectedCostMaster.map(u => `unexpectedCost_${u.id}`)
          ];

          mergeKeys.forEach(k => {
            const col = worksheet3.getColumn(k);
            if (!col || !col.letter) return;        // column might not exist (no data)
            worksheet3.mergeCells(
              `${col.letter}${startRowIdx}:${col.letter}${endRowIdx}`
            );
          });
        }
      }

      /* ───────── TOTAL ROW ───────────────────────────────────────────── */
      const totalRowObj = { tanggal: 'TOTAL' };
      let grandTotal = 0
      Object.entries(grand).forEach(([k, v]) => {
        if (k !== 'tanggal') {
          totalRowObj[k] = priceFormatWIthCurrency(v)
          grandTotal += v;
        };
      });

      const totalRow = worksheet3.addRow(totalRowObj);
      totalRow.eachCell((c, col) => {
        c.alignment = centerMiddle;

        /* thicker border */
        c.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };

        /* green background for every cell in the total row */
        applyCellFill(c, 'FF00B050');
      });

      worksheet3.addRow({});

      const allTotalRowObj = { tanggal: 'GRAND TOTAL', };

      const allTotalRow = worksheet3.addRow(allTotalRowObj);
      allTotalRow.getCell('B').value = priceFormatWIthCurrency(grandTotal);
      allTotalRow.font = fontBold;  // bold text for emphasis

      allTotalRow.eachCell((cell, col) => {
        cell.alignment = centerMiddle;
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };

        // Different fill color for ALL TOTAL (orange)
        applyCellFill(cell, 'FF00B050');
      });

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

  static async getDailyCostMasterData() {
    try {
      const getDataDailyCost = await DailyCostService.findAll({
        orderBy: "ASC"
      })
      const employeesMaster = await MasterDataEmployeeService.findAll({
        active: undefined
      })
      const unexpectedCostMaster = await MasterDataUnexpectedCostCategoryService.findAll({
        active: undefined
      })

      return {
        getDataDailyCost,
        employeesMaster,
        unexpectedCostMaster
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportReportService;
