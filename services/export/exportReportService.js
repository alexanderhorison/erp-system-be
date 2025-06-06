const ExcelJS = require("exceljs");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { applyCellFill, styleExcel, addTo } = require("../../helpers/excelHelperStyle");
const { throwValidation } = require("../../helpers/responses");
const DailyCostService = require("../dailyCost/DailyCostService");
const MasterDataEmployeeService = require("../masterData/MasterDataEmployeeService");
const MasterDataUnexpectedCostCategoryService = require("../masterData/MasterDataUnexpectedCostCategoryService");
const { formatDate } = require("../../helpers/formatDate");

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

      // Data for Sheet 1 & 2
      const getDataReportSo = await SalesOrderReportService.getDataReportSo({
        query: { startDate, endDate },
      });

      // Data for Sheet 3
      const {
        getDataDailyCost,
        employeesMaster,
        unexpectedCostMaster
      } =
        await ExportReportService.getDailyCostMasterData({ startDate, endDate });

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
        biayaPengiriman: 0
      }

      // Process Data For Sheet 1 & 2
      await ExportReportService.generateSheetReportDetailTransaction({
        workbook,
        monthName,
        getDataReportSo,
        dataSheet4
      })

      // Process Data For Sheet 3
      let grandUnexpectedCost = await ExportReportService.generateSheetReportForDailyCost({
        workbook,
        monthName,
        getDataDailyCost,
        employeesMaster,
        unexpectedCostMaster,
        dataSheet4
      })

      // Process Data For Sheet 4
      await ExportReportService.generateSheetReportForLabaRugiKomprehensif({
        workbook,
        monthName,
        dataSheet4
      })

      // Process Data For Sheet 5
      await ExportReportService.generateSheetReportForLabaKomersial({
        workbook,
        monthName,
        dataSheet4,
        unexpectedCostMaster,
        grandUnexpectedCost
      })

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

  static async getDailyCostMasterData(query) {
    try {
      const newQuery = {
        startDate: query.startDate,
        endDate: query.endDate,
        orderBy: "ASC"
      }
      const getDataDailyCost = await DailyCostService.findAll(newQuery)
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

  // Sheet SO 1 for Catatan Pembelian & Sheet 2 for Perincian
  static async generateSheetReportDetailTransaction({ workbook, monthName, getDataReportSo, dataSheet4 }) {
    try {
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      const worksheet = workbook.addWorksheet(`Catatan Pembelian ${monthName}`);
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Sheet 2 For Accumulation Order Transaction
      const worksheet2 = workbook.addWorksheet(`Perincian ${monthName}`);
      worksheet2.views = [{ state: 'frozen', ySplit: 1 }];

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
            pembeli: Master_Customer?.alias || Master_Customer?.name || "",
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

        // Add data for sheet 4
        dataSheet4.pendapatanUsaha += sumTotalJual;
        dataSheet4.bebanPenjualan += sumTotalBeli;
        dataSheet4.labaBruto += Number(totalGainLoss);

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
          transaksi: Master_Customer?.alias || Master_Customer?.name || "",
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

      return dataSheet4;
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForDailyCost({ workbook, monthName, getDataDailyCost, employeesMaster, unexpectedCostMaster, dataSheet4 }) {
    try {
      // Sheet 3 For Daily Cost Transaction
      const worksheet3 = workbook.addWorksheet(`Pengeluaran Transaksi ${monthName}`);

      const { styleBorder, fontBold, centerMiddle } = styleExcel;
      worksheet3.views = [{ state: 'frozen', ySplit: 1 }];

      const employeeCols = employeesMaster.flatMap(emp => ([
        { header: `Gaji ${emp.nama}`, key: `emp_${emp.id}_gaji`, width: 15 },
        { header: `Bonus ${emp.nama}`, key: `emp_${emp.id}_bonus`, width: 15 },
        { header: `Kasbon ${emp.nama}`, key: `emp_${emp.id}_kasbon`, width: 15 },
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

      const headerRow3 = worksheet3.getRow(1);
      headerRow3.font = fontBold;
      headerRow3.alignment = centerMiddle;
      headerRow3.eachCell((cell) => {
        cell.border = styleBorder;
        applyCellFill(cell, "FFFFC1C1");
      });

      // REPORT FOR DAILY COST
      const grand = Object.fromEntries(
        worksheet3.columns.map(c => [c.key, 0])
      );

      const grandUnexpectedCost = {};

      for (const dailyCost of getDataDailyCost) {
        if (dailyCost.costGenerals.length === 0) {
          const rowObj = { tanggal: dailyCost.date };
          dailyCost.costEmployees.forEach((e) => {
            rowObj[`emp_${e.employeeId}_gaji`] = priceFormatWIthCurrency(
              +e.salary || 0
            );
            rowObj[`emp_${e.employeeId}_bonus`] = priceFormatWIthCurrency(
              +e.bonus || 0
            );
            rowObj[`emp_${e.employeeId}_kasbon`] = priceFormatWIthCurrency(
              +e.amountDebt || 0
            );

            addTo(grand, `emp_${e.employeeId}_gaji`, +e.salary || 0);
            addTo(grand, `emp_${e.employeeId}_bonus`, +e.bonus || 0);
            addTo(grand, `emp_${e.employeeId}_kasbon`, +e.amountDebt || 0);
          });

          dailyCost.costUnexpecteds.forEach((u) => {
            const k = `unexpectedCost_${u.categoryId}`;
            rowObj[k] = priceFormatWIthCurrency(+u.price || 0);
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
            if (cell.value === undefined) cell.value = ""; // keep it visually empty

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
              tollCost: priceFormatWIthCurrency(toll),
              fuelCost: priceFormatWIthCurrency(fuel),
              transportAllowance: priceFormatWIthCurrency(transport),
            });

            addTo(grand, "tollCost", toll);
            addTo(grand, "fuelCost", fuel);
            addTo(grand, "transportAllowance", transport);

            dataSheet4.biayaPengiriman += Number(toll) + Number(fuel) + Number(transport)

            if (idx === 0) {
              dailyCost.costEmployees.forEach((e) => {
                rowObj[`emp_${e.employeeId}_gaji`] = priceFormatWIthCurrency(
                  +e.salary || 0
                );
                rowObj[`emp_${e.employeeId}_bonus`] = priceFormatWIthCurrency(
                  +e.bonus || 0
                );
                rowObj[`emp_${e.employeeId}_kasbon`] = priceFormatWIthCurrency(
                  +e.amountDebt || 0
                );

                addTo(grand, `emp_${e.employeeId}_gaji`, +e.salary || 0);
                addTo(grand, `emp_${e.employeeId}_bonus`, +e.bonus || 0);
                addTo(grand, `emp_${e.employeeId}_kasbon`, +e.amountDebt || 0);
              });

              dailyCost.costUnexpecteds.forEach((u) => {
                const k = `unexpectedCost_${u.categoryId}`;
                rowObj[k] = priceFormatWIthCurrency(+u.price || 0);
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
              if (cell.value === undefined) cell.value = ""; // keep it visually empty

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

      // add data for sheet 4
      dataSheet4.bebanOperasi = grandTotal;
      dataSheet4.labaUsaha = Number(dataSheet4.labaBruto) - Number(dataSheet4.bebanOperasi);

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

      return grandUnexpectedCost
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForLabaRugiKomprehensif({ workbook, monthName, dataSheet4 }) {
    try {
      // Worksheet 4 for Laporan Laba Rugi Komprehensif
      const worksheet4 = workbook.addWorksheet(`Laporan Laba Rugi ${monthName}`, {
        views: [{ showGridLines: false }]
      });
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      worksheet4.columns = [
        { width: 40 }, // A
        { width: 5 }, // B
        { width: 20 }, // C
        { width: 2 }, // D
      ];

      // --- Header Title ---
      worksheet4.mergeCells('A1:C1');
      worksheet4.getCell('A1').value = 'PT Tjahaya Berkat Abadi';
      styleCell(worksheet4.getCell('A1'), { bold: true, alignmentHorizontal: 'left' });

      worksheet4.mergeCells('A2:C2');
      worksheet4.getCell('A2').value = 'LAPORAN LABA RUGI KOMPREHENSIF';
      styleCell(worksheet4.getCell('A2'), { bold: true, alignmentHorizontal: 'left' });

      worksheet4.mergeCells('A3:C3');
      worksheet4.getCell('A3').value = formatDate(new Date());
      styleCell(worksheet4.getCell('A3'), { bold: true, alignmentHorizontal: 'left' });

      worksheet4.mergeCells('A4:C4');
      worksheet4.getCell('A4').value = '(Disajikan dalam Rupiah)';
      styleCell(worksheet4.getCell('A4'), { border: { bottom: { style: 'thick' } }, alignmentHorizontal: 'left' });

      worksheet4.addRow([])

      let row;

      row = worksheet4.addRow(['PENDAPATAN'])
      row.font = fontBold
      // row 7
      worksheet4.addRow(['  Pendapatan Usaha', '', priceFormatWIthCurrency(dataSheet4.pendapatanUsaha)])
      styleCell(worksheet4.getCell('C7'), { border: { bottom: { style: 'medium' } }, alignmentHorizontal: 'right' });

      // row 8
      worksheet4.addRow(['TOTAL PENDAPATAN', '', priceFormatWIthCurrency(dataSheet4.pendapatanUsaha)])
      styleCell(worksheet4.getCell('A8'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C8'), { bold: true, alignmentHorizontal: 'right' });

      worksheet4.addRow([])

      // row 10
      worksheet4.addRow(['BEBAN POKOK PENJUALAN', '', priceFormatWIthCurrency(dataSheet4.bebanPenjualan)])
      styleCell(worksheet4.getCell('A10'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C10'), { bold: true, alignmentHorizontal: 'right' });

      worksheet4.addRow([])

      // row 12
      worksheet4.addRow(['LABA BRUTO', '', priceFormatWIthCurrency(dataSheet4.labaBruto)])
      styleCell(worksheet4.getCell('A12'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C12'), { bold: true, alignmentHorizontal: 'right', border: { bottom: { style: 'medium' }, top: { style: 'medium' } } });

      worksheet4.addRow([])

      row = worksheet4.addRow(['BEBAN USAHA'])
      row.font = fontBold

      // row 15
      worksheet4.addRow(['  Beban Operasi', '', priceFormatWIthCurrency(dataSheet4.bebanOperasi)])
      styleCell(worksheet4.getCell('C15'), { border: { bottom: { style: 'medium' } }, alignmentHorizontal: 'right' });

      // row 16
      worksheet4.addRow(['JUMLAH BEBAN USAHA', '', priceFormatWIthCurrency(dataSheet4.bebanOperasi)])
      styleCell(worksheet4.getCell('A16'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C16'), { bold: true, alignmentHorizontal: 'right' });

      worksheet4.addRow([])

      // row 18
      worksheet4.addRow(['LABA USAHA', '', priceFormatWIthCurrency(dataSheet4.labaUsaha)])
      styleCell(worksheet4.getCell('A18'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C18'), { bold: true, alignmentHorizontal: 'right', border: { bottom: { style: 'medium' }, top: { style: 'medium' } } });

      worksheet4.addRow([])

      row = worksheet4.addRow(['PENDAPATAN/(BEBAN) LAINNYA'])
      row.font = fontBold

      // row 21, 22, 23, 24, 25
      worksheet4.addRow(['  Selisih Kurs', '', '-'])
      styleCell(worksheet4.getCell('C21'), { alignmentHorizontal: 'right' });
      worksheet4.addRow(['  Pendapatan Bunga', '', '-'])
      styleCell(worksheet4.getCell('C22'), { alignmentHorizontal: 'right' });
      worksheet4.addRow(['  Beban Bunga', '', '-'])
      styleCell(worksheet4.getCell('C23'), { alignmentHorizontal: 'right' });
      worksheet4.addRow(['  Penghasilan/(Beban) Lainnya', '', '-'])
      styleCell(worksheet4.getCell('C24'), { alignmentHorizontal: 'right' });
      worksheet4.addRow(['  Final Income Tax', '', '-'])
      styleCell(worksheet4.getCell('C25'), { border: { bottom: { style: 'medium' } }, alignmentHorizontal: 'right' });

      // row 26
      worksheet4.addRow(['JUMLAH PENDAPATAN/(BEBAN)', '', '-'])
      styleCell(worksheet4.getCell('A26'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C26'), { bold: true, alignmentHorizontal: 'right' });

      worksheet4.addRow([])

      // row 28
      worksheet4.addRow(['LABA SEBELUM PAJAK', '', priceFormatWIthCurrency(dataSheet4.labaUsaha)])
      styleCell(worksheet4.getCell('A28'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C28'), { bold: true, alignmentHorizontal: 'right', border: { bottom: { style: 'medium' }, top: { style: 'medium' } } });

      worksheet4.addRow([])

      // row 29
      row = worksheet4.addRow(['BEBAN PAJAK PENGHASILAN'])
      row.font = fontBold

      // row 30, 31
      worksheet4.addRow(['  Tahun Berjalan', '', '-'])
      styleCell(worksheet4.getCell('C31'), { alignmentHorizontal: 'right' });
      worksheet4.addRow(['  Tangguhan', '', '-'])
      styleCell(worksheet4.getCell('C32'), { alignmentHorizontal: 'right', border: { bottom: { style: 'medium' } } });


      // row 32
      worksheet4.addRow(['JUMLAH BEBAN PAJAK', '', '-'])
      styleCell(worksheet4.getCell('A33'), { bold: true, alignmentHorizontal: 'left' });
      styleCell(worksheet4.getCell('C33'), { bold: true, alignmentHorizontal: 'right' });

      worksheet4.addRow([])

      // row 35
      worksheet4.addRow(['LABA NETO', '', priceFormatWIthCurrency(dataSheet4.labaUsaha)])
      styleCell(worksheet4.getCell('A35'), { bold: true, alignmentHorizontal: 'left', });
      styleCell(worksheet4.getCell('C35'), { bold: true, alignmentHorizontal: 'right', border: { bottom: { style: 'double' }, top: { style: 'double' } } });

      // --- Outer Thick Border ---
      for (let r = 1; r <= 36; r++) {
        for (let c = 1; c <= 4; c++) {
          const cell = worksheet4.getCell(r, c);
          if (r === 1) cell.border = { ...cell.border, top: { style: 'thick' } };
          if (r === 36) cell.border = { ...cell.border, bottom: { style: 'thick' } };
          if (c === 1) cell.border = { ...cell.border, left: { style: 'thick' } };
          if (c === 4) cell.border = { ...cell.border, right: { style: 'thick' } };
        }
      }

      // add empty spaces
      worksheet4.addRow({})
      worksheet4.addRow([`Jakarta, ${formatDate(new Date())}`])
      for (let i = 0; i < 4; i++) {
        worksheet4.addRow({});
      }
      const michaelRow = worksheet4.addRow(['Michael']);
      michaelRow.getCell(1).font = { bold: true };

      return 'success'
    } catch (error) {
      throw error;
    }
  }

  static async generateSheetReportForLabaKomersial({ workbook, monthName, dataSheet4, unexpectedCostMaster, grandUnexpectedCost }) {
    try {
      const worksheet5 = workbook.addWorksheet('Laba Komersial dan Fiskal', {
        views: [{ showGridLines: false }]
      });

      worksheet5.columns = [
        { width: 40 }, // Uraian
        { width: 20 }, // Komersial
        { width: 20 }, // Koreksi Fiskal - Beda Waktu
        { width: 20 }, // Koreksi Fiskal - Beda Tetap
        { width: 20 }, // Fiskal
      ];

      const doubleBorder = {
        top: { style: 'double' },
        left: { style: 'double' },
        bottom: { style: 'double' },
        right: { style: 'double' }
      }

      // --- Header Title ---
      worksheet5.mergeCells('A1:E1');
      worksheet5.getCell('A1').value = 'PT Tjahaya Berkat Abadi';
      styleCell(worksheet5.getCell('A1'), { bold: true, alignmentHorizontal: 'left' })

      worksheet5.mergeCells('A2:E2');
      worksheet5.getCell('A2').value = 'PERHITUNGAN LABA RUGI';
      styleCell(worksheet5.getCell('A2'), { bold: true, alignmentHorizontal: 'left' })


      worksheet5.mergeCells('A3:E3');
      const dateNow = formatDate(new Date());
      worksheet5.getCell('A3').value = dateNow;
      styleCell(worksheet5.getCell('A3'), { bold: true, alignmentHorizontal: 'left' })



      // --- Blank row for spacing ---
      worksheet5.getRow(4).height = 15;

      // --- Subtitle Centered ---
      worksheet5.mergeCells('A5:E5');
      worksheet5.getCell('A5').value = 'Rekonsiliasi Perhitungan Rugi Laba Komersial dan Fiskal';
      worksheet5.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center', };
      styleCell(worksheet5.getCell('A5'), { bold: true })


      // --- Header Rows (3-row header) ---
      worksheet5.mergeCells('A7:A9');
      worksheet5.getCell('A7').value = 'Uraian';
      worksheet5.getCell('A7').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('A7').font = { bold: true };
      worksheet5.getCell('A7').border = doubleBorder;


      worksheet5.mergeCells('B7:B8');
      worksheet5.getCell('B7').value = 'Komersial';
      worksheet5.getCell('B7').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('B7').font = { bold: true };
      worksheet5.getCell('B7').border = doubleBorder;


      worksheet5.getCell('B9').value = 'Rp.';
      worksheet5.getCell('B9').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('B9').font = { bold: true };
      worksheet5.getCell('B9').border = doubleBorder;

      worksheet5.mergeCells('C7:D7');
      worksheet5.getCell('C7').value = 'Koreksi Fiskal';
      styleCell(worksheet5.getCell('C7'), { border: doubleBorder, bold: true, alignmentHorizontal: 'center' })

      worksheet5.getCell('C8').value = 'Beda Waktu';
      styleCell(worksheet5.getCell('C8'), { border: doubleBorder, bold: true, alignmentHorizontal: 'center' })

      worksheet5.getCell('C9').value = 'Rp.';
      worksheet5.getCell('C9').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('C9').font = { bold: true };
      worksheet5.getCell('C9').border = doubleBorder;


      worksheet5.getCell('D8').value = 'Beda Tetap';
      styleCell(worksheet5.getCell('D8'), { border: doubleBorder, bold: true, alignmentHorizontal: 'center' })

      worksheet5.getCell('D9').value = 'Rp.';
      worksheet5.getCell('D9').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('D9').font = { bold: true };
      worksheet5.getCell('D9').border = doubleBorder;

      worksheet5.mergeCells('E7:E8');
      worksheet5.getCell('E7').value = 'Fiskal';
      worksheet5.getCell('E7').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('E7').font = { bold: true };
      worksheet5.getCell('E7').border = doubleBorder;


      worksheet5.getCell('E9').value = 'Rp.';
      worksheet5.getCell('E9').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet5.getCell('E9').font = { bold: true };
      worksheet5.getCell('E9').border = doubleBorder;

      let gajiTunjangan = Number(dataSheet4.bebanOperasi) - Number(dataSheet4.biayaPengiriman);

      const unexpectedCostTotalRows = unexpectedCostMaster.map((cost) => {
        const key = `unexpectedCost_${cost.id}`;
        const total = grandUnexpectedCost[key] || 0;
        gajiTunjangan -= total;
        return [
          cost.name,
          total,
          0,
          0,
          total
        ];
      });

      const labaBersih = Number(dataSheet4.labaBruto) - Number(dataSheet4.bebanOperasi)
      const biayaPengiriman = Number(dataSheet4.biayaPengiriman)
      const data = [
        ['Pendapatan Bersih', dataSheet4.pendapatanUsaha, 0, 0, dataSheet4.pendapatanUsaha,],
        ['Harga Pokok Penjualan', dataSheet4.bebanPenjualan, 0, 0, dataSheet4.bebanPenjualan],
        ['  LABA KOTOR', dataSheet4.labaBruto, 0, 0, dataSheet4.labaBruto],
        ['BEBAN USAHA', '', '', '', '', 'center'],
        ['Gaji Upah dan Tunjangan lainnya', gajiTunjangan, 0, 0, gajiTunjangan],
        ['Biaya Pengiriman', biayaPengiriman, 0, 0, biayaPengiriman],
        ...unexpectedCostTotalRows,
        ['  JUMLAH BEBAN USAHA', dataSheet4.bebanOperasi, 0, 0, dataSheet4.bebanOperasi],
        ['LABA (RUGI) USAHA', labaBersih, 0, 0, labaBersih],
        ['  PENDAPATAN (BEBAN) LAIN-LAIN', '', '', '', '', 'center'],
        ['Pendapatan lain-lain', 0, 0, 0, 0],
        ['Pendapatan Bunga', 0, 0, 0, 0],
        ['Komisi Penjualan', 0, 0, 0, 0],
        ['  PENDAPATAN (BEBAN) LAIN-LAIN BERSIH', 0, 0, 0, 0, 'center'],
        ['Laba Sebelum Taksiran Pajak Penghasilan', labaBersih, 0, 0, labaBersih],
        ['Provision for Income Tax', 0, 0, 0, 0],
        ['  TAKSIRAN PAJAK PENGHASILAN', 0, 0, 0, 0],
        ['  LABA BERSIH', labaBersih, 0, 0, labaBersih],
      ];

      let startRow = 10;
      data.forEach((row, idx) => {
        const rowIndex = startRow + idx;
        const isCentered = row[5] === 'center';
        const displayRow = isCentered ? row.slice(0, -1) : row; // Remove 'center' if present

        const r = worksheet5.getRow(rowIndex);

        const isUppercase =
          typeof displayRow[0] === 'string' &&
          displayRow[0].trim().toUpperCase() === displayRow[0].trim();

        const formattedRow = displayRow.map((val, colIdx) => {
          if (typeof val === 'number') {
            return priceFormatWIthCurrency(val); // Format number
          }
          return val;
        });

        r.values = formattedRow;
        r.height = 20;

        for (let col = 1; col <= displayRow.length; col++) {
          const cell = worksheet5.getCell(rowIndex, col);

          // Default alignment
          cell.alignment = { vertical: 'middle', horizontal: 'left' };

          // Right-align numbers (integer or float)
          if (typeof displayRow[col - 1] === 'number') {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else if (isCentered && col === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          // if column is uppercase for column 1
          if (col === 1 && isUppercase) {
            cell.font = { bold: true };
          }

          // Apply double border border
          cell.border = doubleBorder
        }
      });

      // --- Outer Thick Border ---
      const outerStartRow = 1;
      const outerEndRow = startRow + data.length;
      for (let r = outerStartRow; r <= outerEndRow; r++) {
        for (let c = 1; c <= 6; c++) {
          const cell = worksheet5.getCell(r, c);
          if (r === outerStartRow) cell.border = { ...cell.border, top: { style: 'thick' } };
          if (r === outerEndRow) cell.border = { ...cell.border, bottom: { style: 'thick' } };
          if (c === 1) cell.border = { ...cell.border, left: { style: 'thick' } };
          if (c === 6) cell.border = { ...cell.border, right: { style: 'thick' } };
        }
      }

      // add empty spaces
      worksheet5.addRow({})
      worksheet5.addRow([`Jakarta, ${dateNow}`])
      for (let i = 0; i < 4; i++) {
        worksheet5.addRow({});
      }
      const michaelRow = worksheet5.addRow(['Michael']);
      michaelRow.getCell(1).font = { bold: true };


      return 'success'

    } catch (error) {
      throw error;
    }
  }
}

function styleCell(cell, options = {}) {
  if (options.bold) cell.font = { bold: true };
  if (options.alignmentHorizontal) cell.alignment = { horizontal: options.alignmentHorizontal };
  if (options.alignmentVertical) cell.alignment = { vertical: options.alignmentVertical };
  if (options.border) cell.border = options.border;
}

module.exports = ExportReportService;
