const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // 🔧 Fix: Add connection timeout and retry
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});


/* ✔ verify once (helps catch wrong app-password / gmail issue) */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail server connection failed:", error);
  } else {
    console.log("✅ Mail server ready to send emails");
  }
});

async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Leave Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    return info;
  } catch (error) {
    console.error("❌ Error while sending mail:", error);
    throw error;   // important → so your controller knows it failed
  }
}

module.exports = { sendMail };
