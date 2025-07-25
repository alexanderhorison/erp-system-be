const { throwValidation } = require("../../helpers/responses");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const DailyCostService = require("../dailyCost/DailyCostService");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const moment = require('moment');

function calculateRevenue(salesOrders, dailyCosts) {
  let totalRevenue = 0;
  let totalGrossProfit = 0;
  let totalCost = 0;

  for (const { grandTotal, totalGainLoss } of salesOrders) {
    totalGrossProfit += Number(totalGainLoss) || 0;
    totalRevenue += Number(grandTotal) || 0;
  }

  for (const { grandTotal } of dailyCosts) {
    totalCost += Number(grandTotal) || 0;
  }

  const totalNetProfit = totalGrossProfit - totalCost;
  return { totalRevenue, totalGrossProfit, totalCost, totalNetProfit };
}

// Helper function to calculate percentage difference
function calcPercent(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100; // avoid division by zero
  return ((current - previous) / previous) * 100;
}

function getPeriodRange(year, typeOfMonth, period) {
  let startMonth, endMonth;

  if (typeOfMonth === "semester") {
    if (period === 1) {
      startMonth = 1; // Jan
      endMonth = 6;   // Jun
    } else if (period === 2) {
      startMonth = 7; // Jul
      endMonth = 12;  // Dec
    } else {
      throw new Error("Valid semester value must be 1 or 2");
    }
  } else if (typeOfMonth === "quarter") {
    if (period < 1 || period > 4) {
      throw new Error("Invalid quarter value");
    }
    startMonth = (period - 1) * 3 + 1;
    endMonth = startMonth + 2;
  } else {
    throw new Error("Invalid typeOfMonth");
  }

  // JS Date months are 0-based, so subtract 1
  const startDate = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0));

  // Create end date: last day of the end month at 23:59:59.999
  const end = new Date(Date.UTC(year, endMonth, 0)); // day 0 of next month
  end.setUTCHours(23, 59, 59, 999); // end of day

  return {
    startDate,
    endDate: end
  };
}

class DashboardFinanceService {
  static async getRevenue({ query }) {
    try {
      const { startDate, endDate } = generateFilterDate(
        query.month,
        query.year
      )

      // 1. Calculate previous month and year
      let prevMonth = Number(query.month) - 1;
      let prevYear = Number(query.year);
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const { startDate: prevStartDate, endDate: prevEndDate } = generateFilterDate(prevMonth, prevYear);

      // 2. Fetch current and previous data
      const [currentSO, prevSO] = await Promise.all([
        SalesOrderReportService.getDataReportSo({ query: { startDate, endDate } }),
        SalesOrderReportService.getDataReportSo({ query: { startDate: prevStartDate, endDate: prevEndDate } })
      ]);


      const [currentDailyCost, prevDailyCost] = await Promise.all([
        DailyCostService.findAll({ startDate, endDate, orderBy: "ASC" }),
        DailyCostService.findAll({ startDate: prevStartDate, endDate: prevEndDate, orderBy: "ASC" })
      ]);

      // 3. Calculate for current
      const current = calculateRevenue(currentSO, currentDailyCost);
      // 4. Calculate for previous
      const previous = calculateRevenue(prevSO, prevDailyCost);

      // 5. Calculate percentage comparison
      const percent = {
        revenue: calcPercent(current.totalRevenue, previous.totalRevenue),
        grossProfit: calcPercent(current.totalGrossProfit, previous.totalGrossProfit),
        cost: calcPercent(current.totalCost, previous.totalCost),
        netProfit: calcPercent(current.totalNetProfit, previous.totalNetProfit)
      };

      return {
        current: {
          labelRevenue: priceFormatWIthCurrency(current.totalRevenue),
          revenue: current.totalRevenue,
          labelGrossProfit: priceFormatWIthCurrency(current.totalGrossProfit),
          grossProfit: current.totalGrossProfit,
          labelCost: priceFormatWIthCurrency(current.totalCost),
          cost: current.totalCost,
          labelNetProfit: priceFormatWIthCurrency(current.totalNetProfit),
          netProfit: current.totalNetProfit,
        },
        percentChange: {
          revenue: `${percent.revenue.toFixed(0)}%`,
          grossProfit: `${percent.grossProfit.toFixed(0)}%`,
          cost: `${percent.cost.toFixed(0)}%`,
          netProfit: `${percent.netProfit.toFixed(0)}%`,
        },
      };
    } catch (error) {
      throw error
    }
  }

  static async getProfitLoss({ query }) {
    try {
      const { typeOfMonth, period, year } = query;
      const { startDate, endDate } = getPeriodRange(year, typeOfMonth, period);

      const dataMap = new Map();
      const salesOrders = await SalesOrderReportService.getDataReportSo({ query: { startDate, endDate } })

      for (const order of salesOrders) {
        const approvedAt = order.approvedAt;

        if (!moment(approvedAt).isValid()) {
          console.warn("Invalid date:", approvedAt);
          continue;
        }

        const monthKey = moment(approvedAt).format("YYYY-MM");

        const jual = Number(order.grandTotalCustomer) || 0;
        const gainLoss = Number(order.totalGainLoss) || 0;
        const modal = jual - gainLoss;
        const pendapatan = Number(order.grandTotal) || 0;

        if (!dataMap.has(monthKey)) {
          dataMap.set(monthKey, {
            hargaJual: 0,
            hargaModal: 0,
            gainLoss: 0,
            pendapatan: 0
          });
        }

        const monthData = dataMap.get(monthKey);
        monthData.hargaJual += jual;
        monthData.hargaModal += modal;
        monthData.gainLoss += gainLoss;
        monthData.pendapatan += pendapatan;
      }

      const result = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, values]) => ({
          month,
          numberMonth: Number(moment(month).format("M")),
          labelMonth: moment(month).format("MMMM"),
          ...values,
        }));

      return result
    } catch (error) {
      throw error
    }
  }

  static async getProfitLossYearly() {
    try {
      const dateNow = new Date();
      const currentYear = dateNow.getFullYear();

      const startDate = moment(`${currentYear - 2}-01-01`).startOf("day").toDate(); // Jan 1st, 2 years ago
      const endDate = moment(`${currentYear}-12-31`).endOf("day").toDate();

      const dataMap = new Map();
      const salesOrders = await SalesOrderReportService.getDataReportSo({ query: { startDate, endDate } })

      for (const order of salesOrders) {
        const approvedAt = order.approvedAt;

        if (!moment(approvedAt).isValid()) {
          console.warn("Invalid date:", approvedAt);
          continue;
        }

        const yearKey = moment(approvedAt).format("YYYY");

        const jual = Number(order.grandTotalCustomer) || 0;
        const gainLoss = Number(order.totalGainLoss) || 0;
        const modal = jual - gainLoss;
        const pendapatan = Number(order.grandTotal) || 0;

        if (!dataMap.has(yearKey)) {
          dataMap.set(yearKey, {
            hargaJual: 0,
            hargaModal: 0,
            gainLoss: 0,
            pendapatan: 0
          });
        }

        const yearData = dataMap.get(yearKey);
        yearData.hargaJual += jual;
        yearData.hargaModal += modal;
        yearData.gainLoss += gainLoss;
        yearData.pendapatan += pendapatan;
      }

      const result = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, values]) => ({
          year: Number(year),
          ...values,
        }));

      return result
    } catch (error) {
      throw error
    }
  }
}

module.exports = DashboardFinanceService;