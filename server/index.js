const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { query, initDatabase } = require('./db');
const { numberToWordsINR } = require('./utils/numberToWords');
const { generateReceiptPdf, generateAllAccountsPdf } = require('./services/pdfService');
const { sendReceiptEmail, verifySmtpConnection } = require('./services/mailerService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// 1. DASHBOARD & STATS
// ---------------------------------------------------------------------------
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_collections,
        COUNT(id) as total_receipts
      FROM receipts
    `);

    const monthRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as month_collections,
        COUNT(id) as month_receipts
      FROM receipts
      WHERE DATE_TRUNC('month', receipt_date) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    const donorsRes = await query(`SELECT COUNT(*) as total_donors FROM donors`);

    const headBreakdownRes = await query(`
      SELECT head_name, COUNT(*) as count, SUM(amount) as total
      FROM receipts
      GROUP BY head_name
      ORDER BY total DESC
    `);

    const modeBreakdownRes = await query(`
      SELECT payment_mode, COUNT(*) as count, SUM(amount) as total
      FROM receipts
      GROUP BY payment_mode
      ORDER BY total DESC
    `);

    const recentReceiptsRes = await query(`
      SELECT * FROM receipts
      ORDER BY id DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        totalCollections: parseFloat(totalRes.rows[0].total_collections),
        totalReceipts: parseInt(totalRes.rows[0].total_receipts),
        monthCollections: parseFloat(monthRes.rows[0].month_collections),
        monthReceipts: parseInt(monthRes.rows[0].month_receipts),
        totalDonors: parseInt(donorsRes.rows[0].total_donors),
        headBreakdown: headBreakdownRes.rows.map(r => ({
          name: r.head_name,
          count: parseInt(r.count),
          total: parseFloat(r.total),
        })),
        modeBreakdown: modeBreakdownRes.rows.map(r => ({
          mode: r.payment_mode,
          count: parseInt(r.count),
          total: parseFloat(r.total),
        })),
        recentReceipts: recentReceiptsRes.rows,
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2. TRUST SETTINGS & SMTP CONFIGURATION
// ---------------------------------------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM trust_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    const settings = { ...result.rows[0] };
    // Mask password in response for security, but indicate whether it is configured
    settings.has_smtp_pass = Boolean(settings.smtp_pass);
    settings.smtp_pass = settings.smtp_pass ? '••••••••' : '';
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    // Check if password was left masked, keep existing if so
    let passClause = '';
    const params = [
      s.trust_name, s.tagline, s.reg_number, s.tax_exemption_80g, s.tax_exemption_12a,
      s.pan_number, s.address, s.contact_phone, s.email, s.website,
      s.currency_symbol, s.currency_code, s.signatory_name, s.signatory_title,
      s.receipt_prefix, s.smtp_host, parseInt(s.smtp_port || 587),
      Boolean(s.smtp_secure), s.smtp_user, s.smtp_from_name, s.smtp_from_email,
    ];

    let updateQuery = `
      UPDATE trust_settings SET
        trust_name = $1, tagline = $2, reg_number = $3, tax_exemption_80g = $4,
        tax_exemption_12a = $5, pan_number = $6, address = $7, contact_phone = $8,
        email = $9, website = $10, currency_symbol = $11, currency_code = $12,
        signatory_name = $13, signatory_title = $14, receipt_prefix = $15,
        smtp_host = $16, smtp_port = $17, smtp_secure = $18, smtp_user = $19,
        smtp_from_name = $20, smtp_from_email = $21, updated_at = NOW()
    `;

    if (s.smtp_pass && s.smtp_pass !== '••••••••') {
      params.push(s.smtp_pass);
      updateQuery += `, smtp_pass = $${params.length}`;
    }

    updateQuery += ` WHERE id = 1 RETURNING *`;

    const result = await query(updateQuery, params);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/verify-smtp', async (req, res) => {
  try {
    const config = req.body;
    if (!config.smtp_pass || config.smtp_pass === '••••••••') {
      const dbSettings = await query('SELECT smtp_pass FROM trust_settings WHERE id = 1');
      config.smtp_pass = dbSettings.rows[0]?.smtp_pass || '';
    }
    await verifySmtpConnection(config);
    res.json({ success: true, message: 'SMTP credentials verified successfully! Emails can now be delivered.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Upload and dynamically update official trust emblem/logo
app.post('/api/settings/upload-logo', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const serverLogoPath = path.join(__dirname, 'assets/logo.png');
    const clientLogoPath = path.join(__dirname, '../client/public/logo.png');

    fs.writeFileSync(serverLogoPath, buffer);
    if (fs.existsSync(path.dirname(clientLogoPath))) {
      fs.writeFileSync(clientLogoPath, buffer);
    }
    res.json({ success: true, message: 'Official Trust Logo updated successfully across all receipts and PDFs' });
  } catch (err) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dispatch live sample receipt email to test SMTP integration
app.post('/api/settings/test-email', async (req, res) => {
  try {
    const { recipient_email } = req.body;
    if (!recipient_email) {
      return res.status(400).json({ success: false, error: 'Recipient email address is required' });
    }
    const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
    const settings = settingsRes.rows[0] || {};

    const sampleReceipt = {
      id: 0,
      receipt_number: `${settings.receipt_prefix || 'TR/REC'}-TEST`,
      receipt_date: new Date().toISOString(),
      receipt_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      donor_name: 'Test Trust Member',
      donor_email: recipient_email,
      donor_phone: '+91 98765 00000',
      donor_address: 'Trust Headquarters, Test Office',
      amount: 1000.00,
      amount_words: 'Rupees One Thousand Only',
      payment_mode: 'UPI',
      cheque_or_tx_ref: 'TEST-TX-12345',
      bank_name: 'HDFC Bank',
      head_name: 'Monthly Member Contribution',
    };

    const pdfBuffer = await generateReceiptPdf(sampleReceipt, settings);
    const mailResult = await sendReceiptEmail(sampleReceipt, pdfBuffer);

    if (!mailResult.success) {
      return res.status(400).json({ success: false, error: mailResult.error || mailResult.reason || 'Failed to dispatch email' });
    }
    res.json({ success: true, message: `Live test receipt email dispatched successfully to ${recipient_email}!` });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3. ACCOUNT HEADS
// ---------------------------------------------------------------------------
app.get('/api/heads', async (req, res) => {
  try {
    const result = await query('SELECT * FROM account_heads ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/heads', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Account head name is required' });
    const result = await query(
      `INSERT INTO account_heads (name, code, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, code || name.slice(0, 8).toUpperCase(), description || '']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4. DONORS
// ---------------------------------------------------------------------------
app.get('/api/donors', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*,
        COUNT(r.id) as receipt_count,
        COALESCE(SUM(r.amount), 0) as total_contributed
      FROM donors d
      LEFT JOIN receipts r ON r.donor_id = d.id
      GROUP BY d.id
      ORDER BY d.full_name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/donors', async (req, res) => {
  try {
    const { full_name, pan_or_id, phone, whatsapp, email, address, notes } = req.body;
    if (!full_name) return res.status(400).json({ success: false, error: 'Full name is required' });
    const result = await query(`
      INSERT INTO donors (full_name, pan_or_id, phone, whatsapp, email, address, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [full_name, pan_or_id || '', phone || '', whatsapp || '', email || '', address || '', notes || '']);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 5. RECEIPTS / BILLS
// ---------------------------------------------------------------------------
app.get('/api/receipts', async (req, res) => {
  try {
    const { search, head_id, payment_mode, from_date, to_date } = req.query;
    let queryStr = `SELECT * FROM receipts WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (receipt_number ILIKE $${params.length} OR donor_name ILIKE $${params.length} OR donor_pan ILIKE $${params.length} OR donor_phone ILIKE $${params.length})`;
    }

    if (head_id) {
      params.push(parseInt(head_id));
      queryStr += ` AND head_id = $${params.length}`;
    }

    if (payment_mode) {
      params.push(payment_mode);
      queryStr += ` AND payment_mode = $${params.length}`;
    }

    if (from_date) {
      params.push(from_date);
      queryStr += ` AND receipt_date >= $${params.length}`;
    }

    if (to_date) {
      params.push(to_date);
      queryStr += ` AND receipt_date <= $${params.length}`;
    }

    queryStr += ` ORDER BY id DESC`;

    const result = await query(queryStr, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/receipts', async (req, res) => {
  const client = await query('BEGIN');
  try {
    const {
      donor_id,
      donor_name,
      donor_pan,
      donor_phone,
      donor_whatsapp,
      donor_email,
      donor_address,
      head_id,
      head_name,
      amount,
      payment_mode,
      cheque_or_tx_ref,
      bank_name,
      receipt_date,
      notes,
      auto_send_email = true,
    } = req.body;

    const resolvedHeadName = head_name || 'Monthly Member Contribution';

    if (!donor_name || !amount) {
      await query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Member / Donor Name and Amount are required' });
    }

    // 1. Fetch settings for prefix & next number
    const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
    const settings = settingsRes.rows[0];

    const currentYear = new Date().getFullYear();
    const nextYear = (currentYear + 1).toString().slice(2);
    const fyString = `${currentYear}-${nextYear}`;
    const prefix = settings.receipt_prefix || 'TR';
    const num = settings.next_receipt_number || 1001;
    const receiptNumber = `${prefix}/${fyString}/${num.toString().padStart(4, '0')}`;

    // 2. Calculate amount in words
    const amountNum = parseFloat(amount);
    const amountWords = numberToWordsINR(amountNum);

    // 3. Resolve or create donor
    let resolvedDonorId = donor_id ? parseInt(donor_id) : null;
    if (!resolvedDonorId && donor_name) {
      const donorCheck = await query('SELECT id FROM donors WHERE LOWER(full_name) = LOWER($1) LIMIT 1', [donor_name.trim()]);
      if (donorCheck.rows.length > 0) {
        resolvedDonorId = donorCheck.rows[0].id;
      } else {
        const newDonor = await query(
          `INSERT INTO donors (full_name, pan_or_id, phone, whatsapp, email, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [donor_name.trim(), donor_pan || '', donor_phone || '', donor_whatsapp || '', donor_email || '', donor_address || '']
        );
        resolvedDonorId = newDonor.rows[0].id;
      }
    }

    // 4. Insert Receipt
    const receiptInsert = await query(`
      INSERT INTO receipts (
        receipt_number, receipt_date, donor_id, donor_name, donor_pan,
        donor_phone, donor_whatsapp, donor_email, donor_address,
        head_id, head_name, amount, amount_words, payment_mode,
        cheque_or_tx_ref, bank_name, notes, email_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `, [
      receiptNumber,
      receipt_date || new Date().toISOString().slice(0, 10),
      resolvedDonorId,
      donor_name.trim(),
      donor_pan ? donor_pan.trim().toUpperCase() : '',
      donor_phone || '',
      donor_whatsapp || '',
      donor_email ? donor_email.trim() : '',
      donor_address || '',
      head_id ? parseInt(head_id) : null,
      resolvedHeadName,
      amountNum,
      amountWords,
      payment_mode || 'Cash',
      cheque_or_tx_ref || '',
      bank_name || '',
      notes || '',
      donor_email && auto_send_email ? 'Pending' : 'Skipped',
    ]);

    const receipt = receiptInsert.rows[0];

    // Increment next receipt number in trust_settings
    await query('UPDATE trust_settings SET next_receipt_number = next_receipt_number + 1 WHERE id = 1');
    await query('COMMIT');

    // 5. Automated Email via SMTP in Background
    if (auto_send_email && receipt.donor_email) {
      generateReceiptPdf(receipt, settings)
        .then(pdfBuffer => sendReceiptEmail(receipt, pdfBuffer))
        .catch(err => console.error('[Background Email Error]:', err));
    }

    res.json({
      success: true,
      data: receipt,
      message: `Receipt ${receipt.receipt_number} generated successfully.`,
    });
  } catch (err) {
    await query('ROLLBACK');
    console.error('Error generating receipt:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 6. SINGLE RECEIPT PDF DOWNLOAD & VIEW
// ---------------------------------------------------------------------------
app.get('/api/receipts/:id/pdf', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const receiptRes = await query('SELECT * FROM receipts WHERE id = $1', [id]);
    if (receiptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }
    const receipt = receiptRes.rows[0];

    const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
    const settings = settingsRes.rows[0];

    const pdfBuffer = await generateReceiptPdf(receipt, settings);

    const filename = `Receipt_${receipt.receipt_number.replace(/[\/\\]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error serving receipt PDF:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 7. ONE-CLICK PDF FOR ALL ACCOUNTS (CONSOLIDATED STATEMENT & LEDGER)
// ---------------------------------------------------------------------------
app.get('/api/receipts/export/all-pdf', async (req, res) => {
  try {
    const { from_date, to_date, head_id } = req.query;
    let queryStr = `SELECT * FROM receipts WHERE 1=1`;
    const params = [];

    if (from_date) {
      params.push(from_date);
      queryStr += ` AND receipt_date >= $${params.length}`;
    }
    if (to_date) {
      params.push(to_date);
      queryStr += ` AND receipt_date <= $${params.length}`;
    }
    if (head_id) {
      params.push(parseInt(head_id));
      queryStr += ` AND head_id = $${params.length}`;
    }

    queryStr += ` ORDER BY receipt_date ASC, id ASC`;

    const receiptsRes = await query(queryStr, params);
    const receipts = receiptsRes.rows;

    const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
    const settings = settingsRes.rows[0];

    const pdfBuffer = await generateAllAccountsPdf(receipts, settings);

    const filename = `Trust_All_Accounts_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating all accounts PDF:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 8. MANUAL RE-SEND EMAIL VIA SMTP
// ---------------------------------------------------------------------------
app.post('/api/receipts/:id/send-email', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const receiptRes = await query('SELECT * FROM receipts WHERE id = $1', [id]);
    if (receiptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }
    const receipt = receiptRes.rows[0];
    if (!receipt.donor_email) {
      return res.status(400).json({ success: false, error: 'Donor does not have an email address recorded' });
    }

    const settingsRes = await query('SELECT * FROM trust_settings WHERE id = 1');
    const settings = settingsRes.rows[0];

    const pdfBuffer = await generateReceiptPdf(receipt, settings);
    const mailResult = await sendReceiptEmail(receipt, pdfBuffer);

    res.json({
      success: mailResult.success,
      message: mailResult.success ? `Receipt emailed to ${receipt.donor_email}` : `Failed: ${mailResult.error}`,
      details: mailResult,
    });
  } catch (err) {
    console.error('Error triggering manual email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server & Initialize Database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`TrustAccount Pro Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();
