const nodemailer = require('nodemailer');

let transporter = null;

try {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection on startup
    transporter.verify((err, success) => {
      if (err) {
        console.error('❌ Email transporter error:', err.message);
      } else {
        console.log('✅ Email transporter ready');
      }
    });
  } else {
    console.warn('⚠️  Email not configured — codes will log to console only');
  }
} catch (err) {
  console.error('❌ Failed to create email transporter:', err.message);
}

const sendVerificationEmail = async (toEmail, code, userName) => {
  const subject = 'CMS Ethiopia - Verify Your Email';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">CMS Ethiopia</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.9;">Crime Management System</p>
      </div>
      <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827;">Hello ${userName},</h2>
        <p style="color: #4b5563;">
          Welcome to CMS Ethiopia. Use the code below to verify your email address
          and unlock full access to reporting and police department services.
        </p>
        <div style="background: white; border: 2px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Your verification code</p>
          <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; font-family: monospace;">
            ${code}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code expires in <strong>10 minutes</strong>. If you did not create an account, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} CMS Ethiopia · All rights reserved
        </p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('\n═══════════════════════════════════════════');
    console.log('📧 EMAIL NOT CONFIGURED — Console fallback:');
    console.log(`   To: ${toEmail}`);
    console.log(`   Code: ${code}`);
    console.log('═══════════════════════════════════════════\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CMS Ethiopia" <noreply@cms.com>',
      to: toEmail,
      subject,
      html,
    });
    console.log(`✅ Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    console.log(`   Fallback code for ${toEmail}: ${code}`);
  }
};

module.exports = { transporter, sendVerificationEmail };