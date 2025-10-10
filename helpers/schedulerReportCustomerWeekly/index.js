const cron = require("node-cron");
const SalesOrderService = require("../../services/salesOrder/SalesOrderService");
const transporter = require("../emailConfig");
const jwt = require("jsonwebtoken");

const SCHEDULER_REPORT_CUSTOMER_WEEKLY = process.env.SCHEDULER_REPORT_CUSTOMER_WEEKLY || "0 23 * * 0"; // every sunday at 11 PM
const cronjob = cron.schedule(`${SCHEDULER_REPORT_CUSTOMER_WEEKLY}`, async () => {
  try {
    await SalesOrderService.runSchedulerReportCustomerWeekly();
    console.log(`Report SCHEDULER_REPORT_CUSTOMER_WEEKLY With Ranking email sent successfully.`);
  } catch (error) {
    console.log("Error Scheduler on Report Sales Order With Ranking: ", error);
  }
})

module.exports = cronjob;