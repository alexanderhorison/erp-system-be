const cron = require("node-cron");
const PointOfSaleService = require("../../services/pointOfSale/PointOfSaleService");

const SCHEDULER_REPORT_POS = process.env.SCHEDULER_REPORT_POS|| "0 6 * * *"; // every day at 6 AM
const cronjob = cron.schedule(`${SCHEDULER_REPORT_POS}`, async () => {
  try {
    await PointOfSaleService.runSchedulerReportPos();
    console.log(`Report SCHEDULER_REPORT_POS email sent successfully.`);
  } catch (error) {
    console.log("Error Scheduler on Report Point of Sales: ", error);
  }
})

module.exports = cronjob;