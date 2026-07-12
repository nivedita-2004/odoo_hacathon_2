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
const sendWelcomeEmail = async (email, name) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const mailOptions = {
    from: `"AssetFlow AI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to AssetFlow AI! You have been invited.',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f3448; font-size: 28px; margin: 0;">AssetFlow AI</h1>
        </div>
        <h2 style="color: #333333; font-size: 24px; font-weight: 600; margin-bottom: 15px;">Welcome, ${name}!</h2>
        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          You have been invited to join your organization on AssetFlow AI, the premium asset management and ERP platform.
        </p>
        <div style="background-color: #f7f3f6; padding: 20px; border-radius: 6px; margin-bottom: 25px; text-align: center;">
          <p style="color: #4f3448; font-size: 16px; font-weight: 500; margin: 0;">Ready to get started?</p>
          <p style="color: #666666; font-size: 14px; margin-top: 5px;">Simply click below to securely log in using your Google account, or set up a password via OTP.</p>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${loginUrl}" style="display: inline-block; background-color: #4f3448; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 4px;">Access Your Workspace</a>
        </div>
        <p style="color: #888888; font-size: 13px; text-align: center; border-top: 1px solid #eaeaea; padding-top: 20px;">
          If you received this email by mistake, simply ignore it.<br>
          &copy; ${new Date().getFullYear()} AssetFlow AI. All rights reserved.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcomeEmail };
