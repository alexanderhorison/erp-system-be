const moment = require("moment");
const { sequelize: sq, Monthly_Equity } = require("../../models");
const { throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const DailyCostService = require("../dailyCost/DailyCostService");

class EquityService {
  static async createEquity(data) {
    try {
      const { date, shareCapital, notes = null } = data;

      const exsistingEquity = await Monthly_Equity.findOne({
        where: {
          date: moment(date).format("YYYY-MM-DD"),
        },
      });

      if (exsistingEquity) {
        throwValidation(400, "Data ekuitas untuk tanggal ini sudah ada");
      }

      const thisYear = moment(date).year();
      const lastYear = thisYear - 1;

      // Saldo Laba Tahun Lalu
      const retainedEarningsPreviousYear =
        await EquityService.getRetainedEarningsPerYear(lastYear);

      // Saldo Laba Tahun Berjalan → dari januari sampai bulan inputan user
      const thisMonth = moment(date).month() + 1; // moment().month() returns 0-11, so add 1
      const retainedEarningsCurrentYear =
        thisMonth === 1
          ? 0 // Jika bulan Januari, tidak ada bulan sebelumnya di tahun yang sama
          : await EquityService.getRetainedEarningsPerYear(
              thisYear,
              thisMonth - 1
            ); // Hanya sampai bulan sebelumnya

      // Saldo Laba (Bulan {Juni}) = Laba Bruto (Sheet 4 SO) - Beban Usaha (Sheet 3 SO Grand Total)
      const retainedEarningsThisMonth =
        await EquityService.getRetainedEarningsThisMonth(thisYear, thisMonth);

      console.log(`=== Summary Retained Earnings ===`);
      console.log(`Tahun ${lastYear}: ${retainedEarningsPreviousYear}`);
      console.log(`Tahun ${thisYear}: ${retainedEarningsCurrentYear}`);
      console.log(
        `Bulan ${thisMonth}/${thisYear}: ${retainedEarningsThisMonth}`
      );
      console.log(`=== End Summary ===\n`);

      const equity = {
        date: moment(date).format("YYYY-MM-DD"),
        shareCapital: shareCapital || 0, // Input user
        retainedEarningsPreviousYear: retainedEarningsPreviousYear, // Saldo Laba Tahun Sebelum
        retainedEarningsCurrentYear: retainedEarningsCurrentYear, // Saldo Laba Tahun Berjalan → dari januari sampai bulan {Juni}
        retainedEarningsThisMonth: retainedEarningsThisMonth, // Saldo Laba (Bulan {Juni}) = Laba Bruto (Sheet 4 SO) - Beban Usaha (Sheet 3 SO Grand Total)
        totalEquity:
          shareCapital -
          retainedEarningsPreviousYear +
          retainedEarningsCurrentYear, //!  apakah retainedEarningsThisMonth tetap masuk?
        notes: notes || null,
      };

      console.log("Creating new equity with data:", equity);

      const newEquity = await Monthly_Equity.create(equity);

      return newEquity;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(query) {
    try {
      const result = await Monthly_Equity.findAll({
        order: [["date", "DESC"]],
        attributes: [
          "id",
          "date",
          "shareCapital",
          "retainedEarningsPreviousYear",
          "retainedEarningsCurrentYear",
          "retainedEarningsThisMonth",
          "totalEquity",
          "notes",
        ],
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getDetail(id) {
    try {
      const result = await Monthly_Equity.findOne({
        where: {
          id,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateEquity(id, data) {
    try {
      const { shareCapital, notes } = data;

      const existingEquity = await Monthly_Equity.findOne({
        where: {
          id,
        },
      });

      if (!existingEquity) {
        throwValidation(404, "Data ekuitas tidak ditemukan");
      }

      // Ambil tahun dan bulan dari equity yang akan diupdate
      const equityDate = moment(existingEquity.date);
      const thisYear = equityDate.year();
      const lastYear = thisYear - 1;
      const thisMonth = equityDate.month() + 1;

      console.log(
        `=== Updating Equity untuk ${equityDate.format("YYYY-MM-DD")} ===`
      );

      // Hitung ulang semua retained earnings
      console.log("Menghitung ulang Retained Earnings...");

      const retainedEarningsPreviousYear =
        await EquityService.getRetainedEarningsPerYear(lastYear);

      const retainedEarningsCurrentYear =
        thisMonth === 1
          ? 0 // Jika bulan Januari, tidak ada bulan sebelumnya di tahun yang sama
          : await EquityService.getRetainedEarningsPerYear(
              thisYear,
              thisMonth - 1
            ); // Hanya sampai bulan sebelumnya

      const retainedEarningsThisMonth =
        await EquityService.getRetainedEarningsThisMonth(thisYear, thisMonth);

      console.log(`=== Summary Recalculated Retained Earnings ===`);
      console.log(`Tahun ${lastYear}: ${retainedEarningsPreviousYear}`);
      console.log(`Tahun ${thisYear}: ${retainedEarningsCurrentYear}`);
      console.log(
        `Bulan ${thisMonth}/${thisYear}: ${retainedEarningsThisMonth}`
      );
      console.log(`=== End Summary ===\n`);

      // Prepare update data - termasuk retained earnings yang sudah dihitung ulang
      const updateData = {
        retainedEarningsPreviousYear: retainedEarningsPreviousYear,
        retainedEarningsCurrentYear: retainedEarningsCurrentYear,
        retainedEarningsThisMonth: retainedEarningsThisMonth,
      };

      if (shareCapital !== undefined) {
        updateData.shareCapital = shareCapital || 0;
        // Update totalEquity juga jika shareCapital berubah
        updateData.totalEquity = shareCapital || 0;
      } else {
        // Jika shareCapital tidak diubah, tetap gunakan nilai existing
        updateData.totalEquity = existingEquity.shareCapital || 0;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      // Update equity dengan data yang sudah dihitung ulang
      await existingEquity.update(updateData);

      // Fetch updated data
      const updatedEquity = await Monthly_Equity.findOne({
        where: { id },
        attributes: [
          "id",
          "date",
          "shareCapital",
          "retainedEarningsPreviousYear",
          "retainedEarningsCurrentYear",
          "retainedEarningsThisMonth",
          "totalEquity",
          "notes",
        ],
      });

      console.log(
        `Equity dengan ID ${id} berhasil diupdate dengan perhitungan ulang`
      );

      return updatedEquity;
    } catch (error) {
      throw error;
    }
  }

  static async deleteEquity(id) {
    try {
      const exsistingEquity = await Monthly_Equity.findOne({
        where: {
          id,
        },
      });
      if (!exsistingEquity) {
        throwValidation(404, "Data ekuitas tidak ditemukan");
      }
      await exsistingEquity.destroy();
      return { message: "Data ekuitas berhasil dihapus" };
    } catch (error) {
      throw error;
    }
  }

  static async getRetainedEarningsPerYear(year, endMonth = 12) {
    try {
      // Generate start dan end date untuk tahun yang diminta
      const startDate = moment(`${year}-01-01`).format("YYYY-MM-DD");
      const endDate = moment(
        `${year}-${endMonth.toString().padStart(2, "0")}-01`
      )
        .endOf("month")
        .format("YYYY-MM-DD");
      console.log(startDate, endDate);

      console.log(
        `=== Menghitung Retained Earnings untuk tahun ${year} (sampai bulan ${endMonth}) ===`
      );
      console.log(`Date range: ${startDate} to ${endDate}`);

      // Ambil data SO dan Daily Cost untuk tahun tersebut
      const getDataReportSo = await SalesOrderReportService.getDataReportSo({
        query: { startDate, endDate },
      });

      console.log(`Jumlah Sales Order ditemukan: ${getDataReportSo.length}`);

      const getDataDailyCost = await DailyCostService.findAll({
        startDate,
        endDate,
        orderBy: "ASC",
      });

      console.log(`Jumlah Daily Cost ditemukan: ${getDataDailyCost.length}`);

      // Initialize perhitungan seperti di ExportReportService
      let totalPendapatanUsaha = 0;
      let totalBebanPenjualan = 0;
      let totalLabaBruto = 0;

      // Hitung Laba Bruto dari Sales Order
      for (const order of getDataReportSo) {
        const { Sales_Order_Details, totalGainLoss } = order;

        let sumTotalJual = 0;
        let sumTotalBeli = 0;

        for (const detail of Sales_Order_Details) {
          const { modal, price, quantity } = detail;
          sumTotalBeli += (modal || 0) * quantity;
          sumTotalJual += price * quantity;
        }

        // Hitung manual gain/loss untuk akurasi (totalGainLoss di DB sering tidak sinkron)
        const manualGainLoss = sumTotalJual - sumTotalBeli;

        totalPendapatanUsaha += sumTotalJual;
        totalBebanPenjualan += sumTotalBeli;
        totalLabaBruto += manualGainLoss;
      }

      console.log(
        `After SO calculation - Pendapatan: ${totalPendapatanUsaha}, Beban: ${totalBebanPenjualan}, Laba Bruto: ${totalLabaBruto}`
      );

      // Hitung total beban operasi dari Daily Cost
      let totalBebanOperasi = 0;

      for (const dailyCost of getDataDailyCost) {
        // Gaji, bonus, kasbon karyawan
        dailyCost.costEmployees.forEach((e) => {
          totalBebanOperasi += Number(e.salary || 0);
          totalBebanOperasi += Number(e.bonus || 0);
          totalBebanOperasi += Number(e.amountDebt || 0);
        });

        // Biaya pengiriman
        dailyCost.costGenerals.forEach((g) => {
          totalBebanOperasi += Number(g.tollCost || 0);
          totalBebanOperasi += Number(g.fuelCost || 0);
          totalBebanOperasi += Number(g.transportAllowance || 0);
        });

        // Biaya unexpected
        dailyCost.costUnexpecteds.forEach((u) => {
          totalBebanOperasi += Number(u.price || 0);
        });
      }

      // Hitung Laba Usaha (Retained Earnings) untuk tahun tersebut
      const retainedEarningsThisYear = totalLabaBruto - totalBebanOperasi;

      console.log(
        `=== Hasil Perhitungan Tahun ${year} (Jan-${endMonth
          .toString()
          .padStart(2, "0")}) ===`
      );
      console.log(`Total Pendapatan: ${totalPendapatanUsaha}`);
      console.log(`Total Beban Penjualan: ${totalBebanPenjualan}`);
      console.log(`Total Laba Bruto: ${totalLabaBruto}`);
      console.log(`Total Beban Operasi: ${totalBebanOperasi}`);
      console.log(`Retained Earnings: ${retainedEarningsThisYear}`);
      console.log(`=== End ===\n`);

      // Return hanya nilai yang dibutuhkan untuk equity
      return retainedEarningsThisYear;
    } catch (error) {
      throw error;
    }
  }

  static async getRetainedEarningsThisMonth(year, month) {
    try {
      // Import services yang dibutuhkan
      const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
      const DailyCostService = require("../dailyCost/DailyCostService");

      // Generate start dan end date untuk bulan yang diminta
      const startDate = moment(
        `${year}-${month.toString().padStart(2, "0")}-01`
      ).format("YYYY-MM-DD");
      const endDate = moment(`${year}-${month.toString().padStart(2, "0")}-01`)
        .endOf("month")
        .format("YYYY-MM-DD");

      console.log(
        `=== Menghitung Retained Earnings untuk bulan ${month}/${year} ===`
      );
      console.log(`Date range: ${startDate} to ${endDate}`);

      // Ambil data SO dan Daily Cost untuk bulan tersebut
      const getDataReportSo = await SalesOrderReportService.getDataReportSo({
        query: { startDate, endDate },
      });

      console.log(`Jumlah Sales Order ditemukan: ${getDataReportSo.length}`);

      const getDataDailyCost = await DailyCostService.findAll({
        startDate,
        endDate,
        orderBy: "ASC",
      });

      console.log(`Jumlah Daily Cost ditemukan: ${getDataDailyCost.length}`);

      // Initialize perhitungan seperti di ExportReportService
      let totalPendapatanUsaha = 0;
      let totalBebanPenjualan = 0;
      let totalLabaBruto = 0;

      // Hitung Laba Bruto dari Sales Order
      for (const order of getDataReportSo) {
        const { Sales_Order_Details, totalGainLoss } = order;

        let sumTotalJual = 0;
        let sumTotalBeli = 0;

        for (const detail of Sales_Order_Details) {
          const { modal, price, quantity } = detail;
          sumTotalBeli += (modal || 0) * quantity;
          sumTotalJual += price * quantity;
        }

        // Hitung manual gain/loss untuk akurasi (totalGainLoss di DB sering tidak sinkron)
        const manualGainLoss = sumTotalJual - sumTotalBeli;

        totalPendapatanUsaha += sumTotalJual;
        totalBebanPenjualan += sumTotalBeli;
        totalLabaBruto += manualGainLoss;
      }

      console.log(
        `After SO calculation - Pendapatan: ${totalPendapatanUsaha}, Beban: ${totalBebanPenjualan}, Laba Bruto: ${totalLabaBruto}`
      );

      // Hitung total beban operasi dari Daily Cost
      let totalBebanOperasi = 0;

      for (const dailyCost of getDataDailyCost) {
        // Gaji, bonus, kasbon karyawan
        dailyCost.costEmployees.forEach((e) => {
          totalBebanOperasi += Number(e.salary || 0);
          totalBebanOperasi += Number(e.bonus || 0);
          totalBebanOperasi += Number(e.amountDebt || 0);
        });

        // Biaya pengiriman
        dailyCost.costGenerals.forEach((g) => {
          totalBebanOperasi += Number(g.tollCost || 0);
          totalBebanOperasi += Number(g.fuelCost || 0);
          totalBebanOperasi += Number(g.transportAllowance || 0);
        });

        // Biaya unexpected
        dailyCost.costUnexpecteds.forEach((u) => {
          totalBebanOperasi += Number(u.price || 0);
        });
      }

      // Hitung Laba Usaha (Retained Earnings) untuk bulan tersebut
      const retainedEarningsThisMonth = totalLabaBruto - totalBebanOperasi;

      console.log(`=== Hasil Perhitungan Bulan ${month}/${year} ===`);
      console.log(`Total Pendapatan: ${totalPendapatanUsaha}`);
      console.log(`Total Beban Penjualan: ${totalBebanPenjualan}`);
      console.log(`Total Laba Bruto: ${totalLabaBruto}`);
      console.log(`Total Beban Operasi: ${totalBebanOperasi}`);
      console.log(`Retained Earnings: ${retainedEarningsThisMonth}`);
      console.log(`=== End ===\n`);

      // Return hanya nilai yang dibutuhkan untuk equity
      return retainedEarningsThisMonth;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailByPeriod(date) {
    try {
      const equity = await Monthly_Equity.findOne({
        where: {
          date,
        },
      });
      if (!equity) {
        return {
          shareCapital: 0, // Modal Saham
          retainedEarningsPreviousYear: 0, // Saldo Laba Tahun Lalu
          retainedEarningsCurrentYear: 0, // Saldo Laba Tahun Berjalan
          retainedEarningsThisMonth: 0, // Saldo Laba
          totalEquity: 0, // Ekuitas
        };
      }
      return {
        shareCapital: equity.shareCapital || 0, // Modal Saham
        retainedEarningsPreviousYear: equity.retainedEarningsPreviousYear || 0, // Saldo Laba Tahun Lalu
        retainedEarningsCurrentYear: equity.retainedEarningsCurrentYear || 0, // Saldo Laba Tahun Berjalan
        retainedEarningsThisMonth: equity.retainedEarningsThisMonth || 0, // Saldo Laba
        totalEquity: equity.totalEquity || 0, // Ekuitas
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EquityService;
