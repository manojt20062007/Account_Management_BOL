const nodemailer = require('nodemailer');
const { query } = require('../db');

/**
 * Creates and returns an active Nodemailer transporter.
 * Prioritizes trust_settings from the database; falls back to .env.
 */
async function getTransporter() {
  const res = await query('SELECT * FROM trust_settings WHERE id = 1');
  const settings = res.rows[0] || {};

  const host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587');
  const secure = settings.smtp_secure !== undefined ? settings.smtp_secure : (process.env.SMTP_SECURE === 'true');
  const user = (settings.smtp_user || process.env.SMTP_USER || '').trim();
  const rawPass = (settings.smtp_pass || process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    // If user has not yet configured credentials, use ethereal / fallback test transporter
    return {
      isMock: true,
      transporter: null,
      fromEmail: settings.email || 'trust.receipts@example.org',
      fromName: settings.trust_name || 'BRIDGE OF LOVE',
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000, // 10s connection timeout for fast failover/reporting
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return {
    isMock: false,
    transporter,
    fromEmail: settings.smtp_from_email || user,
    fromName: settings.smtp_from_name || settings.trust_name || 'BRIDGE OF LOVE',
  };
}

/**
 * Automatically dispatches donation receipt PDF to the donor's email via SMTP.
 */
async function sendReceiptEmail(receipt, pdfBuffer) {
  if (!receipt.donor_email) {
    console.log(`[SMTP Mailer] No email provided for receipt ${receipt.receipt_number}. Skipping email.`);
    await query(`UPDATE receipts SET email_status = 'Skipped' WHERE id = $1`, [receipt.id]);
    return { success: false, reason: 'No email address on record' };
  }

  const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
  const settings = settingsRes.rows[0] || {};

  try {
    const mailConfig = await getTransporter();

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency_code || 'INR',
    }).format(receipt.amount);

    const emailSubject = `Donation Receipt ${receipt.receipt_number} — ${settings.trust_name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 700; color: #f8fafc; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
          .badge-80g { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; padding: 3px 10px; border-radius: 999px; margin-top: 10px; font-weight: 600; border: 1px solid rgba(52, 211, 153, 0.3); }
          .content { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .message { font-size: 14px; color: #334155; margin-bottom: 24px; }
          .receipt-box { background: #f1f5f9; border-left: 4px solid #0f172a; padding: 18px 20px; border-radius: 6px; margin-bottom: 24px; }
          .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .receipt-row:last-child { margin-bottom: 0; }
          .receipt-label { color: #64748b; font-weight: 500; }
          .receipt-val { color: #0f172a; font-weight: 700; text-align: right; }
          .highlight { font-size: 18px; color: #047857; }
          .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .contact-line { margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${settings.trust_name}</h1>
            <p>${settings.tagline || 'Bridge of Love'}</p>
          </div>
          <div class="content">
            <div class="greeting">Respected ${receipt.donor_name},</div>
            <p class="message">
              Namaste. On behalf of <strong>${settings.trust_name}</strong>, we extend our heartfelt gratitude for your monthly contribution.
            </p>
            <div class="receipt-box">
              <div class="receipt-row">
                <span class="receipt-label">Receipt Number:</span>
                <span class="receipt-val">${receipt.receipt_number}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Receipt Date:</span>
                <span class="receipt-val">${new Date(receipt.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Payment Mode:</span>
                <span class="receipt-val">${receipt.payment_mode} ${receipt.cheque_or_tx_ref ? `(${receipt.cheque_or_tx_ref})` : ''}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Amount:</span>
                <span class="receipt-val highlight">${formattedAmount}</span>
              </div>
              <div class="receipt-row" style="margin-top:6px; font-size:12px; color:#475569;">
                <span>Amount in words: <em>${receipt.amount_words}</em></span>
              </div>
            </div>
            <p class="message" style="font-size: 13px;">
              Please find your official Payment Receipt attached as a PDF to this email.
            </p>
          </div>
          <div class="footer">
            <div class="contact-line"><strong>${settings.trust_name}</strong></div>
            <div class="contact-line">${settings.address || ''}</div>
            <div class="contact-line">Phone: ${settings.contact_phone || ''} | Email: ${settings.email || ''}</div>
            <div class="contact-line" style="margin-top:8px; color:#94a3b8; font-size:11px;">This is a system generated official receipt.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (mailConfig.isMock) {
      console.log(`[SMTP Notice] Real SMTP credentials (Gmail App Password) not configured yet in settings. Simulating delivery for receipt ${receipt.receipt_number} to ${receipt.donor_email}`);
      if (receipt.id && receipt.id > 0) {
        await query(
          `UPDATE receipts SET email_status = 'Sent (Simulated)', emailed_at = NOW(), email_error = NULL WHERE id = $1`,
          [receipt.id]
        );
        await query(
          `INSERT INTO dispatch_logs (receipt_id, channel, recipient, status, details) VALUES ($1, 'Email', $2, 'Sent (Simulated)', 'Simulated dispatch. Configure SMTP in Trust Settings for live delivery.')`,
          [receipt.id, receipt.donor_email]
        );
      }
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: `"${mailConfig.fromName}" <${mailConfig.fromEmail}>`,
      to: receipt.donor_email,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `Receipt_${receipt.receipt_number.replace(/[\/\\]/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await mailConfig.transporter.sendMail(mailOptions);
    console.log(`[SMTP Mailer] Receipt ${receipt.receipt_number} sent successfully to ${receipt.donor_email}:`, info.messageId);

    if (receipt.id && receipt.id > 0) {
      await query(
        `UPDATE receipts SET email_status = 'Sent', emailed_at = NOW(), email_error = NULL WHERE id = $1`,
        [receipt.id]
      );

      await query(
        `INSERT INTO dispatch_logs (receipt_id, channel, recipient, status, details) VALUES ($1, 'Email', $2, 'Sent', $3)`,
        [receipt.id, receipt.donor_email, `Message ID: ${info.messageId}`]
      );
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    let detailedError = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      detailedError = `Connection to SMTP server timed out (${error.code || 'TIMEOUT'}). Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587. To send on Render Free: use Brevo on Port 2525 (allowed on free tier) or upgrade Render instance to Starter.`;
    } else if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      detailedError = `Google rejected SMTP login (535). Please ensure 2-Step Verification is enabled and you generated a 16-letter App Password at myaccount.google.com/apppasswords.`;
    }

    console.error(`[SMTP Mailer Error] Failed to send email to ${receipt.donor_email}:`, detailedError);

    if (receipt.id && receipt.id > 0) {
      await query(
        `UPDATE receipts SET email_status = 'Failed', email_error = $1 WHERE id = $2`,
        [detailedError, receipt.id]
      );
      await query(
        `INSERT INTO dispatch_logs (receipt_id, channel, recipient, status, details) VALUES ($1, 'Email', $2, 'Failed', $3)`,
        [receipt.id, receipt.donor_email, detailedError]
      );
    }
    return { success: false, error: detailedError };
  }
}

/**
 * Validates SMTP configuration credentials.
 */
async function verifySmtpConnection(customConfig) {
  const host = customConfig.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(customConfig.smtp_port || process.env.SMTP_PORT || '587');
  const user = (customConfig.smtp_user || process.env.SMTP_USER || '').trim();
  const rawPass = (customConfig.smtp_pass || process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('SMTP Username (Email) and App Password are required to test connection');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    return await transporter.verify();
  } catch (error) {
    let msg = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      msg = `Connection to ${host}:${port} timed out (${error.code || 'TIMEOUT'}). Render Free Tier blocks outbound SMTP ports 25, 465, and 587. To send emails on Render: switch to Brevo with Port 2525 (allowed on free tier) or upgrade Render web service to Starter ($7/mo).`;
    } else if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      msg = `Google SMTP rejected login credentials (535). You must use a 16-letter Google App Password generated at myaccount.google.com/apppasswords with 2-Step Verification enabled.`;
    }
    throw new Error(msg);
  }
}

module.exports = {
  sendReceiptEmail,
  verifySmtpConnection,
};
