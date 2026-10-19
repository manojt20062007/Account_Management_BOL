const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { query, initDatabase } = require('./db');
const { numberToWordsINR } = require('./utils/numberToWords');
const { generateReceiptPdf, generateAllAccountsPdf } = require('./services/pdfService');
const { sendReceiptEmail, verifySmtpConnection } = require('./services/mailerService');
const { hashPassword, verifyPassword, generateToken, verifyToken } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Token Verification Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid or expired session token' });
  }
  req.user = decoded;
  next();
}

// ---------------------------------------------------------------------------
// 0. AUTHENTICATION & USER MANAGEMENT (SIGNUP & LOGIN - NO OTP)
// ---------------------------------------------------------------------------

// Signup: Personal info, no OTP required, instantly signs in & registers as donor
app.post('/api/auth/signup', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone = '',
      whatsapp = '',
      address = '',
      pan_or_id = '',
    } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Valid Email Address is required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();

    // Check if user account already exists
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    // Link or create matching entry in donors table
    let donorId = null;
    const existingDonor = await query(
      `SELECT id FROM donors WHERE LOWER(email) = $1 OR (phone = $2 AND $2 != '') LIMIT 1`,
      [cleanEmail, phone.trim()]
    );

    if (existingDonor.rows.length > 0) {
      donorId = existingDonor.rows[0].id;
      await query(`
        UPDATE donors 
        SET full_name = $1, 
            phone = COALESCE(NULLIF($2, ''), phone), 
            whatsapp = COALESCE(NULLIF($3, ''), whatsapp), 
            address = COALESCE(NULLIF($4, ''), address), 
            pan_or_id = COALESCE(NULLIF($5, ''), pan_or_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [cleanName, phone.trim(), whatsapp.trim() || phone.trim(), address.trim(), pan_or_id.trim().toUpperCase(), donorId]);
    } else {
      const newDonor = await query(`
        INSERT INTO donors (full_name, email, phone, whatsapp, address, pan_or_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [cleanName, cleanEmail, phone.trim(), whatsapp.trim() || phone.trim(), address.trim(), pan_or_id.trim().toUpperCase()]);
      donorId = newDonor.rows[0].id;
    }

    // Hash password & create user record
    const { hash, salt } = hashPassword(password);
    const insertUser = await query(`
      INSERT INTO users (full_name, email, phone, whatsapp, address, pan_or_id, role, donor_id, password_hash, password_salt)
      VALUES ($1, $2, $3, $4, $5, $6, 'donor', $7, $8, $9)
      RETURNING id, full_name, email, phone, whatsapp, address, pan_or_id, role, donor_id, created_at
    `, [cleanName, cleanEmail, phone.trim(), whatsapp.trim() || phone.trim(), address.trim(), pan_or_id.trim().toUpperCase(), donorId, hash, salt]);

    const user = insertUser.rows[0];
    await query('UPDATE donors SET user_id = $1 WHERE id = $2', [user.id, donorId]);

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Account created and signed in successfully!',
      token,
      user,
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1',
      [cleanIdentifier, email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);
    const userSafe = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      whatsapp: user.whatsapp,
      address: user.address,
      pan_or_id: user.pan_or_id,
      role: user.role,
      donor_id: user.donor_id,
      created_at: user.created_at,
    };

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: userSafe,
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile / Current Session
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, phone, whatsapp, address, pan_or_id, role, donor_id, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member / Donor Portal Dashboard: Payments, Months Paid, Download Bills
app.get('/api/user/portal', authenticateToken, async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userRes.rows[0];

    // Find all receipts matching this member by donor_id, email, or phone
    const receiptsRes = await query(`
      SELECT * FROM receipts 
      WHERE (donor_id IS NOT NULL AND donor_id = $1)
         OR (LOWER(donor_email) = LOWER($2) AND $2 != '')
         OR (donor_phone = $3 AND $3 != '')
      ORDER BY receipt_date DESC, id DESC
    `, [user.donor_id, user.email, user.phone || '']);

    const receipts = receiptsRes.rows;

    // Metrics
    const totalContributed = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalReceipts = receipts.length;

    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYearReceipts = receipts.filter(r => {
      const d = new Date(r.receipt_date);
      return d.getFullYear() === currentYear;
    });

    const yearContributed = currentYearReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const monthlyBreakdown = months.map((monthName, idx) => {
      const monthNum = idx + 1;
      const monthReceipts = currentYearReceipts.filter(r => {
        const d = new Date(r.receipt_date);
        return (d.getMonth() + 1) === monthNum;
      });

      const totalPaid = monthReceipts.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      return {
        month: monthName,
        monthIndex: idx,
        year: currentYear,
        isPaid: monthReceipts.length > 0,
        amountPaid: totalPaid,
        receiptCount: monthReceipts.length,
        receipts: monthReceipts.map(r => ({
          id: r.id,
          receipt_number: r.receipt_number,
          receipt_date: r.receipt_date,
          amount: parseFloat(r.amount),
          payment_mode: r.payment_mode,
        })),
      };
    });

    const monthsPaidCount = monthlyBreakdown.filter(m => m.isPaid).length;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          address: user.address,
          pan_or_id: user.pan_or_id,
          role: user.role,
        },
        summary: {
          totalContributed,
          totalReceipts,
          yearContributed,
          monthsPaidCount,
          currentYear,
        },
        monthlyBreakdown,
        receipts,
      },
    });
  } catch (err) {
    console.error('Error fetching member portal data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
    // Prioritize or fallback to environment variables from Render/hosting
    settings.smtp_host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
    settings.smtp_port = settings.smtp_port || parseInt(process.env.SMTP_PORT || '587');
    settings.smtp_user = settings.smtp_user || process.env.SMTP_USER || '';
    settings.smtp_from_name = settings.smtp_from_name || settings.trust_name || 'BRIDGE OF LOVE';
    settings.smtp_from_email = settings.smtp_from_email || settings.smtp_user || process.env.SMTP_USER || '';

    // Mask password in response for security, but indicate whether it is configured (DB or Env)
    const effectivePass = settings.smtp_pass || process.env.SMTP_PASS || '';
    settings.has_smtp_pass = Boolean(effectivePass);
    settings.smtp_pass = settings.has_smtp_pass ? '••••••••' : '';
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    const params = [
      s.trust_name, s.tagline, s.reg_number, s.tax_exemption_80g, s.tax_exemption_12a,
      s.pan_number, s.address, s.contact_phone, s.email, s.website,
      s.currency_symbol, s.currency_code, s.signatory_name, s.signatory_title,
      s.receipt_prefix, s.smtp_host || 'smtp.gmail.com', parseInt(s.smtp_port || 587),
      Boolean(s.smtp_secure), (s.smtp_user || '').trim(), (s.smtp_from_name || '').trim(), (s.smtp_from_email || '').trim(),
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

    if (s.smtp_pass && s.smtp_pass !== '••••••••' && s.smtp_pass.trim() !== '') {
      params.push(s.smtp_pass.trim().replace(/\s+/g, ''));
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
    const config = { ...req.body };
    if (!config.smtp_pass || config.smtp_pass === '••••••••') {
      const dbSettings = await query('SELECT smtp_pass FROM trust_settings WHERE id = 1');
      config.smtp_pass = dbSettings.rows[0]?.smtp_pass || process.env.SMTP_PASS || '';
    }
    if (!config.smtp_user) {
      const dbSettings = await query('SELECT smtp_user FROM trust_settings WHERE id = 1');
      config.smtp_user = dbSettings.rows[0]?.smtp_user || process.env.SMTP_USER || '';
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

    const now = new Date();
    const currentISTTime = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const sampleReceipt = {
      id: 0,
      receipt_number: `${settings.receipt_prefix || 'TR/REC'}-TEST`,
      receipt_date: now.toISOString(),
      receipt_time: currentISTTime,
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
// 4. DONORS (WITH REGISTERED MEMBER STATUS)
// ---------------------------------------------------------------------------
app.get('/api/donors', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*,
        u.id as user_account_id,
        u.email as user_email,
        (u.id IS NOT NULL) as is_registered,
        COUNT(r.id) as receipt_count,
        COALESCE(SUM(r.amount), 0) as total_contributed
      FROM donors d
      LEFT JOIN users u ON (u.donor_id = d.id OR (LOWER(u.email) = LOWER(d.email) AND d.email != ''))
      LEFT JOIN receipts r ON r.donor_id = d.id
      GROUP BY d.id, u.id
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

    let validHeadId = null;
    let resolvedHeadName = head_name || 'Monthly Member Contribution';
    if (head_id) {
      const headCheck = await query('SELECT id, name FROM account_heads WHERE id = $1', [parseInt(head_id)]);
      if (headCheck.rows.length > 0) {
        validHeadId = headCheck.rows[0].id;
        resolvedHeadName = headCheck.rows[0].name;
      }
    }

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

    // 4. Compute IST receipt time & Insert Receipt
    const now = new Date();
    const currentISTTime = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const resolvedReceiptTime = req.body.receipt_time || currentISTTime;

    const receiptInsert = await query(`
      INSERT INTO receipts (
        receipt_number, receipt_date, receipt_time, donor_id, donor_name, donor_pan,
        donor_phone, donor_whatsapp, donor_email, donor_address,
        head_id, head_name, amount, amount_words, payment_mode,
        cheque_or_tx_ref, bank_name, notes, email_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `, [
      receiptNumber,
      receipt_date || new Date().toISOString().slice(0, 10),
      resolvedReceiptTime,
      resolvedDonorId,
      donor_name.trim(),
      donor_pan ? donor_pan.trim().toUpperCase() : '',
      donor_phone || '',
      donor_whatsapp || '',
      donor_email ? donor_email.trim() : '',
      donor_address || '',
      validHeadId,
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
