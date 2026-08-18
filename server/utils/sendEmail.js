const nodemailer = require("nodemailer");

const sendEmail = async (option) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(`Email credentials are not set in enviroment variable`);
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: option.to,
      subject: option.subject,
      text: option.text,
      html: `<p>${option.text}</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
 } catch (error) {
  console.error("Email sending error:", error.message);
  throw error;
}
};

module.exports = sendEmail;
