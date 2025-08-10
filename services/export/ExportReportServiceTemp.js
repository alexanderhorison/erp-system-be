const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
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
const NonCurrentAssetService = require("../asset/NonCurrentAssetService");
const ShortTermService = require("../liabilities/ShortTermService");
const LongTermService = require("../liabilities/LongTermService");
const EquityService = require("../equity/EquityService");

class ExportReportService {
  static async getReport({ query }) {
    const enumTypeReport = {
      SALES_ORDER: "SALES_ORDER",
    };

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
        { header: headers[6], key: "totalHargaBeli", width: 20 },
        { header: headers[7], key: "totalHargaJual", width: 20 },
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

        // Apply RED to headers Tanggal → Quantity
        if (colNumber >= 1 && colNumber <= 8) {
          applyCellFill(cell, "FFFFC1C1");
        }

        // Apply BLUE to Gain/Loss
        if (colNumber === 9) {
          applyCellFill(cell, "FFADD8E6");
        }
      });

      let rowIndex = 2; // Start inserting data from row 2

      // Report for SO Sheet 1
      for (const order of getDataReportSo) {
        const {
          approvedAt,
          Master_Customer,
          Sales_Order_Details,
          totalGainLoss,
        } = order;

        const startMergeIndex = rowIndex; // Store merge start index
        let endMergeIndex = startMergeIndex + Sales_Order_Details.length - 1; // Calculate end index
        let sumTotalJual = 0;
        let sumTotalBeli = 0;
        for (const detail of Sales_Order_Details) {
          const { Warehouse_Product, modal, price, quantity } = detail;

          // Insert Data Row
          const dataRow = worksheet.addRow({
            tanggal: approvedAt,
            pembeli: Master_Customer?.alias || Master_Customer?.name || "",
            namaBarang: Warehouse_Product?.Master_Product?.name || "",
            hargaBeli: Number(modal),
            hargaJual: Number(price),
            quantity,
          });

          const rowNumber = dataRow.number;
          worksheet.getCell(`G${rowNumber}`).value = {
            formula: `D${rowNumber}*F${rowNumber}`,
          }; // totalHargaBeli
          worksheet.getCell(`H${rowNumber}`).value = {
            formula: `E${rowNumber}*F${rowNumber}`,
          }; // totalHargaJual
          worksheet.getCell(`I${rowNumber}`).value = {
            formula: `H${rowNumber}-G${rowNumber}`,
          }; // gainLoss

          sumTotalBeli += modal * quantity;
          sumTotalJual += price * quantity;

          // Apply Cell Formatting
          const lastRow = worksheet.lastRow;
          lastRow.eachCell((cell, colNumber) => {
            cell.border = styleBorder;

            // Center align numeric columns
            if (colNumber >= 4 && colNumber <= 9 && colNumber !== 6) {
              cell.alignment = centerMiddle;
              cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
            }

            if (colNumber === 6) {
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
          hargaBeli: { formula: `SUM(D${startMergeIndex}:D${endMergeIndex})` },
          gainLoss: { formula: `SUM(I${startMergeIndex}:I${endMergeIndex})` },
          totalHargaBeli: {
            formula: `SUM(G${startMergeIndex}:G${endMergeIndex})`,
          },
          totalHargaJual: {
            formula: `SUM(H${startMergeIndex}:H${endMergeIndex})`,
          },
        });

        // Add data for sheet 4
        dataSheet4.pendapatanUsaha += sumTotalJual;
        dataSheet4.bebanPenjualan += sumTotalBeli;
        dataSheet4.labaBruto += Number(totalGainLoss);

        dataSheet4Formula.pendapatanUsaha.push(
          `'Catatan Pembelian ${monthName}'!H${totalRow.number}`
        );
        dataSheet4Formula.bebanPenjualan.push(
          `'Catatan Pembelian ${monthName}'!G${totalRow.number}`
        );
        dataSheet4Formula.labaBruto.push(
          `'Catatan Pembelian ${monthName}'!I${totalRow.number}`
        );

        totalRow.font = fontBold;
        totalRow.eachCell((cell, colNumber) => {
          cell.border = styleBorder;

          // Center align numeric total columns
          if (colNumber >= 4 && colNumber <= 9) {
            cell.alignment = centerMiddle;
            /**
             * Positive → "Rp." #,##0
             * Negative → "Rp." -#,##0
             * Zero → "Rp." 0
             */
            cell.numFmt = '"Rp." #,##0; "Rp." -#,##0; "Rp." 0';
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
          transaksi: Master_Customer?.alias || Master_Customer?.name || "",
          nominalTransaksi: {
            formula: `'Catatan Pembelian ${monthName}'!H${endMergeIndex + 1}`,
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
        formula: `SUM(C12-C${
          15 + dataSheet4Formula.unexpectedCost.length + 1
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
