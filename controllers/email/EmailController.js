const transporter = require("../../helpers/emailConfig");
const { responses, throwValidation } = require("../../helpers/responses");

class EmailController {
  static async sendEmail(req, res) {
    // code to send email goes here
    try {
      const schema = yup.object({
        receiver: yup.string().email().required("Email penerima harus diisi"),
      });
      const body = await yupSchemaValidation(req.body, schema);

      const transporterConnection = await transporter();
      const msg = {
        from: "noreply@example.com", // sender address
        to: body?.receiver, // list of receivers
        subject: "Sales Order", // Subject line
        text: "Hello, this is a test email.", // plain text body
      };
      transporterConnection.sendMail(msg, async (err) => {
        if (err) {
          throwValidation(400, "Failed to send email");
        }
        res.status(200).json(responses(true, "Email berhasil dikirim"));
      });
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}
module.exports = EmailController;
