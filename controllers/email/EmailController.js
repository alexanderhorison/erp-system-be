const transporter = require("../../helpers/emailConfig");
const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require('../../helpers/yupSchemaValidation');

class EmailController {
  static async sendEmail(req, res) {
    // code to send email goes here
    try {
      const { filename } = req.body; // Get filename from body
      const pdfBuffer = req.file.buffer; // Get the uploaded file buffer

      const transporterConnection = await transporter();

      const msg = {
        from: process.env.EMAIL_IS, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        subject: "Sales Order", // Subject line
        text: "Berikut hasil print sales order anda", // plain text body
        attachments: [
          {
            filename: filename || "sales-order.pdf", // Use the filename from the request or a default
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
