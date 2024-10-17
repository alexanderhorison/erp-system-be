const nodemailer = require("nodemailer");
async function transporter() {
  try {
    const createTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_IS, // your email address
        pass: process.env.EMAIL_PASSWORD_IS, // your app password
      },
    });
    await createTransporter.verify();
    return createTransporter;
  } catch (error) {
    throw error;
  }
}

module.exports = transporter;
