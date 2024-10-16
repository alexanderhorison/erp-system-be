const nodemailer = require("nodemailer");
async function transporter() {
  try {
    const createTransporter = nodemailer.createTransport({
      // you must define pool:true and maxConnection:1 to ignore concurrent cennections limit
      pool: true,
      maxConnections: 1,
      host: "smtp-mail.outlook.com",
      port: 587,
      tls: { ciphers: "SSLv3" }, // if you define your host, you must define tls
      auth: {
        user: process.env.EMAIL_IS,
        pass: process.env.EMAIL_PASSWORD_IS,
      },
    });
    return createTransporter;
  } catch (error) {
    throw error;
  }
}

module.exports = transporter;
