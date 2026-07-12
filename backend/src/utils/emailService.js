const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"AssetFlow AI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your AssetFlow AI Registration OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f3448;">Welcome to AssetFlow AI!</h2>
        <p>You requested to register a new account. Your one-time password (OTP) is:</p>
        <div style="background-color: #f7f3f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
          <h1 style="color: #4f3448; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
