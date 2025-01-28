const transporter = require("../../helpers/emailConfig");
const { responses } = require("../../helpers/responses");
const ExportService = require("../../services/export/exportService");

class EmailController {
  static async sendEmail(req, res) {
    // code to send email goes here
    try {
      const { filename, module, additionSubjectText } = req.body; // Get filename from body
      // const pdfBuffer = req.file.buffer; // Get the uploaded file buffer

      let pdfBuffer = {}

      if (filename.includes('PO')) {
        pdfBuffer = await ExportService.purchaseOrder(filename);
      }

      if (filename.includes('SO')) {
        pdfBuffer = await ExportService.salesOrder(filename);
      }

      if (!pdfBuffer) {
        pdfBuffer = req.file.buffer;
      }

      const transporterConnection = await transporter();

      /**
       * Module is type (Sales Order / Purchase Order / Barter) example
       * file name is code SO-312312 / GOD-3123123
       * Additional Subject Text is for Sales Order / Purchase Order (Vendor A / Customer A)
       */
      let subjectText = `${module} ${filename} `;
      if (["Sales Order", "Purchase Order"].includes(module)) {
        subjectText += additionSubjectText;
      }
      const msg = {
        from: process.env.EMAIL_IS, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        subject: subjectText, // Subject line
        text: `Berikut Hasil Print ${module} anda`, // plain text body
        attachments: [
          {
            filename: `${filename}.pdf` || "sales-order.pdf", // Use the filename from the request or a default
            content: pdfBuffer, // Attach the PDF buffer
          },
        ],
      };
      await transporterConnection.sendMail(msg);
      res.status(200).json(responses(true, "Email berhasil dikirim"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}
module.exports = EmailController;
