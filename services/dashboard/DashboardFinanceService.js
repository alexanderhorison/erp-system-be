const { throwValidation } = require("../../helpers/responses");
const { generateFilterDate } = require("../../helpers/queryGenerator");
const SalesOrderReportService = require("../salesOrder/SalesOrderReportService");
const DailyCostService = require("../dailyCost/DailyCostService");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const moment = require('moment');
const MasterDataCompanyService = require("../masterData/MasterDataCompanyService");
const { CACHE_KEYS, getOrSetCache } = require('../../helpers/cacheHelper');

function calculateRevenue(salesOrders, dailyCosts, calculateTop5 = false, company = []) {
  let totalRevenue = 0;
  let totalGrossProfit = 0;
  let totalCost = 0;

  const productMap = new Map();
  const companyMap = new Map();

  for (const { grandTotal, totalGainLoss, Sales_Order_Details } of salesOrders) {
    totalGrossProfit += Number(totalGainLoss) || 0;
    totalRevenue += Number(grandTotal) || 0;

    // Calculate for top 5
    /**
     * 1. Loop sales order details, access warehouseProduct Id, get the product id
     * 2. Calculate for same ProductId Assign value for sum gross profit and keep  sum value for harga jual (each same ProductId)
     * 3. sort by sum gross profit
     */
    if (calculateTop5) {
      for (const detail of Sales_Order_Details) {
        const product = detail.Warehouse_Product?.Master_Product;
        if (!product) continue;

        const productId = product.id;
        const productName = product.name;

        const gainLoss = Number(detail.gainLoss || 0);
        const sellingPrice = Number(detail.subTotal || 0);
        const buyingPrice = Number((detail.modal * detail.quantity) || 0);

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName,
            totalGainLoss: 0,
            totalHargaJual: 0,
            totalHargaBeli: 0,
          });
        }

        if (!companyMap.has(product.companyId)) {

          companyMap.set(product.companyId, {
            companyId: product.companyId,
            companyName: company.find(c => c.id === product.companyId)?.name || "Unknown",
            totalGainLoss: 0,
            totalHargaJual: 0,
            totalHargaBeli: 0,
          });
        }
        const companyEntry = companyMap.get(product.companyId);
        companyEntry.totalGainLoss += gainLoss;
        companyEntry.totalHargaJual += sellingPrice;
        companyEntry.totalHargaBeli += buyingPrice;

        const entry = productMap.get(productId);
        entry.totalGainLoss += gainLoss;
        entry.totalHargaJual += sellingPrice;
        entry.totalHargaBeli += buyingPrice;
      }
    }
  }

  for (const { grandTotal } of dailyCosts) {
    totalCost += Number(grandTotal) || 0;
  }

  // Convert Map to Array and calculate percentage
  const grossProfitByProduct = mapTop5(productMap.values());
  const grossProfitByCompany = mapTop5(companyMap.values());

  const totalNetProfit = totalGrossProfit - totalCost;
  return { totalRevenue, totalGrossProfit, totalCost, totalNetProfit, grossProfitByProduct, grossProfitByCompany };
}

function mapTop5(data) {
  return Array.from(data)
    .map(entry => {
      const percent = entry.totalHargaJual > 0
        ? (entry.totalGainLoss / entry.totalHargaJual) * 100
        : 0;
      return {
        ...entry,
        totalGainLossPercent: `${Number(percent.toFixed(2))}%`, // 2 decimal places
      };
    })
    .sort((a, b) => b.totalGainLoss - a.totalGainLoss) // sort by GP value descending
    .slice(0, 5); // top 5
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
      const monthKey = moment(startDate).format("YYYY-MM");
      const month = Number(monthKey.split("-")[1])
      const year = Number(monthKey.split("-")[0]);
      const cacheKey = CACHE_KEYS.FINANCE_REVENUE(month, year);

      // 1. Calculate previous month and year
      let prevMonth = Number(query.month) - 1;
      let prevYear = Number(query.year);
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const { startDate: prevStartDate, endDate: prevEndDate } = generateFilterDate(prevMonth, prevYear);

      return await getOrSetCache(cacheKey, "RevenueFetch", async () => {
        return DashboardFinanceService.getFinanceRevenueFn({
          prevStartDate,
          prevEndDate,
          startDate,
          endDate
        });
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async getFinanceRevenueFn({ prevStartDate, prevEndDate, startDate, endDate }) {
    try {
      // 2. Fetch current and previous data
      const [currentSO, prevSO] = await Promise.all([
        SalesOrderReportService.getDataReportSo({ query: { startDate, endDate } }),
        SalesOrderReportService.getDataReportSo({ query: { startDate: prevStartDate, endDate: prevEndDate } })
      ]);


      const [currentDailyCost, prevDailyCost] = await Promise.all([
        DailyCostService.findAll({ startDate, endDate, orderBy: "ASC" }),
        DailyCostService.findAll({ startDate: prevStartDate, endDate: prevEndDate, orderBy: "ASC" })
      ]);

      const companies = await MasterDataCompanyService.findAll();

      // 3. Calculate for current
      const current = calculateRevenue(currentSO, currentDailyCost, true, companies);
      // 4. Calculate for previous
      const previous = calculateRevenue(prevSO, prevDailyCost);

      // 5. Calculate percentage comparison
      const percent = {
        revenue: calcPercent(current.totalRevenue, previous.totalRevenue),
        grossProfit: calcPercent(current.totalGrossProfit, previous.totalGrossProfit),
        cost: calcPercent(current.totalCost, previous.totalCost),
        netProfit: calcPercent(current.totalNetProfit, previous.totalNetProfit)
      };

      const calculateMargin = ((current.totalNetProfit / current.totalRevenue) * 100) || 0;
      const previousMargin = ((previous.totalNetProfit / previous.totalRevenue) * 100) || 0;

      const marginDelta = calculateMargin - previousMargin;

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
          margin: `${calculateMargin.toFixed(2)}%`,
        },
        percentChange: {
          revenue: `${percent.revenue.toFixed(0)}%`,
          grossProfit: `${percent.grossProfit.toFixed(0)}%`,
          cost: `${percent.cost.toFixed(0)}%`,
          netProfit: `${percent.netProfit.toFixed(0)}%`,
          margin: `${marginDelta.toFixed(2)}%`,
        },
        grossProfitByProduct: current.grossProfitByProduct,
        grossProfitByCompany: current.grossProfitByCompany,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getProfitLoss({ query }) {
    try {
      const { typeOfMonth, period, year } = query;
      const { startDate, endDate } = getPeriodRange(year, typeOfMonth, period);

      let dataMap = new Map();
      const salesOrders = await SalesOrderReportService.getDataReportSo({ query: { startDate, endDate } })
      const dailyCosts = await DailyCostService.findAll({ startDate, endDate, orderBy: "ASC" });

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
            pendapatan: 0,
            cost: 0,
            pengeluaran: 0,
          });
        }

        const monthData = dataMap.get(monthKey);
        monthData.hargaJual += jual;
        monthData.hargaModal += modal;
        monthData.gainLoss += gainLoss;
        monthData.pendapatan += pendapatan;
      }

      for (const { date, grandTotal } of dailyCosts) {
        if (!moment(date).isValid()) {
          console.warn("Invalid date:", date);
          continue;
        }
        const monthKey = moment(date).format("YYYY-MM");

        const grandTotalDc = Number(grandTotal) || 0;

        if (!dataMap.has(monthKey)) {
          dataMap.set(monthKey, {
            hargaJual: 0,
            hargaModal: 0,
            gainLoss: 0,
            pendapatan: 0,
            cost: 0,
            pengeluaran: 0,
          });
        }

        const monthData = dataMap.get(monthKey);
        monthData.cost += grandTotalDc;
      }

      for (const [_, monthData] of dataMap.entries()) {
        monthData.pengeluaran = monthData.hargaModal + monthData.cost;
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

        if (!dataMap.has(yearKey)) {
          dataMap.set(yearKey, {
            hargaJual: 0,
            hargaModal: 0,
            gainLoss: 0,
          });
        }

        const yearData = dataMap.get(yearKey);
        yearData.hargaJual += jual;
        yearData.hargaModal += modal;
        yearData.gainLoss += gainLoss;
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