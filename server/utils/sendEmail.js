const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (option) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const { data, error } = await resend.emails.send({
      from: "AI Cold Mail Generator <onboarding@resend.dev>",
      to: [option.to],
      subject: option.subject,
      text: option.text,
      html: `<p>${option.text}</p>`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data?.id);
  } catch (error) {
    console.error("Email sending error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;