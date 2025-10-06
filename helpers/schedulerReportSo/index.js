const cron = require("node-cron");
const SalesOrderService = require("../../services/salesOrder/SalesOrderService");
const transporter = require("../emailConfig");
const jwt = require("jsonwebtoken");

const SCHEDULER_REPORT_SO = process.env.SCHEDULER_REPORT_SO || "0 23 * * 0"; // every sunday at 11 PM
const cronjob = cron.schedule(`${SCHEDULER_REPORT_SO}`, async () => {
  const dateToday = new Date();
  console.log(`[${dateToday.toISOString()}] Running Report Sales Order With Ranking`);

  try {
    const getReport = await SalesOrderService.getSalesOrderSchedulerReport();

    if (!getReport || getReport.length === 0) {
      console.log("No Sales Order data available for the report.");
      return;
    }

    const transporterConnection = await transporter();

    const rangeDate = new Date();
    rangeDate.setDate(rangeDate.getDate() - 6); // 7 days including today

    let subjectText = `Report SO periode ${rangeDate.toLocaleDateString()} - ${dateToday.toLocaleDateString()}`;

    const tableRows = getReport.map((row, index) => {
      const data = row.get({ plain: true });

      const token = jwt.sign({ customerId: data.customerId }, process.env.TOKEN_KEY, { expiresIn: "3d" });
      const link = `${process.env.IS_URL}/rank-up-customer?token=${token}`;

      return `
        <tr>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${index + 1}</td>
          <td style="border:1px solid #ccc; padding:8px;">${data.Master_Customer?.name || "-"}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${data.totalSo}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">Rp. ${Number(data.totalAmount).toLocaleString("id-ID")}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">
            <a href="${link}" 
              target="_blank"
              style="display:inline-block; padding:6px 12px; background:#28a745; color:#fff; text-decoration:none; border-radius:4px;">
              Level Up
            </a>
          </td>
        </tr>
      `;
    }).join("");

    const htmlBody = `
    <p>Berikut Hasil Belanja SO Customer:</p>
    <table style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:14px;">
      <thead>
        <tr style="background-color:#f2f2f2;">
          <th style="border:1px solid #ccc; padding:8px;">No</th>
          <th style="border:1px solid #ccc; padding:8px;">Customer Name</th>
          <th style="border:1px solid #ccc; padding:8px;">Total SO</th>
          <th style="border:1px solid #ccc; padding:8px;">Total Amount</th>
          <th style="border:1px solid #ccc; padding:8px;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <br>
    <p>Jika ingin menaikkan level customer klik pada tombol action</p>
  `;

    const msg = {
      from: process.env.EMAIL_IS, // sender address
      to: process.env.EMAIL_RECEIVER, // list of receivers
      bcc: process.env.EMAIL_RECEIVER_BCC, // BCC email address
      subject: subjectText, // Subject line
      text: `Berikut Hasil Belanja SO Customer`, // plain text body
      html: htmlBody
    }
    await transporterConnection.sendMail(msg);
    console.log("Report Sales Order With Ranking email sent successfully.");
  } catch (error) {
    console.log("Error Scheduler on Report Sales Order With Ranking: ", error);
  }
})

module.exports = cronjob;