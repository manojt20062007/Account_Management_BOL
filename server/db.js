const { Pool } = require('pg');
const { hashPassword } = require('./utils/auth');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5433'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trust_account_db',
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Trust Settings / Profile Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trust_settings (
        id SERIAL PRIMARY KEY,
        trust_name VARCHAR(255) NOT NULL DEFAULT 'SRI SARADA SEVA CHARITABLE TRUST',
        tagline VARCHAR(255) DEFAULT 'Dedicated to Social Upliftment, Education & Healthcare',
        reg_number VARCHAR(100) DEFAULT 'TR/BK-IV/452/2012',
        tax_exemption_80g VARCHAR(100) DEFAULT 'CIT(E)/BLR/80G/2021-22/AABTS1234F',
        tax_exemption_12a VARCHAR(100) DEFAULT 'CIT(E)/12AA/2013-14/1042',
        pan_number VARCHAR(50) DEFAULT 'AABTS1234F',
        address TEXT DEFAULT '#42, Temple Road, Gandhi Nagar, Bengaluru, Karnataka - 560009',
        contact_phone VARCHAR(50) DEFAULT '+91 98765 43210',
        email VARCHAR(100) DEFAULT 'info@saradatrust.org',
        website VARCHAR(100) DEFAULT 'www.saradatrust.org',
        currency_symbol VARCHAR(10) DEFAULT '₹',
        currency_code VARCHAR(10) DEFAULT 'INR',
        signatory_name VARCHAR(100) DEFAULT 'Sri M. R. Sharma',
        signatory_title VARCHAR(100) DEFAULT 'Managing Trustee',
        receipt_prefix VARCHAR(20) DEFAULT 'TRUST/REC',
        next_receipt_number INT DEFAULT 1001,
        smtp_host VARCHAR(100) DEFAULT 'smtp.gmail.com',
        smtp_port INT DEFAULT 587,
        smtp_secure BOOLEAN DEFAULT false,
        smtp_user VARCHAR(100) DEFAULT '',
        smtp_pass VARCHAR(100) DEFAULT '',
        smtp_from_name VARCHAR(100) DEFAULT 'Sri Sarada Seva Charitable Trust',
        smtp_from_email VARCHAR(100) DEFAULT '',
        whatsapp_message TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure initial row exists
    const resSettings = await client.query('SELECT COUNT(*) FROM trust_settings');
    if (parseInt(resSettings.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO trust_settings (id) VALUES (1);
      `);
    }

    // Ensure whatsapp_message column exists on existing databases & initialize default template
    await client.query(`
      ALTER TABLE trust_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
    `);

    const defaultWhatsAppTemplate = `🙏 *Namaste {donor_name}*,

On behalf of *{trust_name}*, we gratefully acknowledge the receipt of your contribution:
📄 *Receipt No:* {receipt_no}
📅 *Date:* {date}
💰 *Amount:* {amount}
💳 *Payment Mode:* {payment_mode}

📥 *Download Official e-Receipt PDF:*
{pdf_url}

Thank you for your generosity and continuous support.
Warm regards,
*{trust_name}*`;

    await client.query(`
      UPDATE trust_settings 
      SET whatsapp_message = $1 
      WHERE (whatsapp_message IS NULL OR TRIM(whatsapp_message) = '') AND id = 1;
    `, [defaultWhatsAppTemplate]);

    // 2. Account Heads Table (Categories of funds/accounts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS account_heads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        code VARCHAR(50) UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Populate standard trust account heads if empty
    const resHeads = await client.query('SELECT COUNT(*) FROM account_heads');
    if (parseInt(resHeads.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO account_heads (name, code, description) VALUES
          ('Corpus Fund (Earmarked Capital)', 'CORPUS', 'Long-term corpus donation towards trust capital fund (exempt under Section 11(1)(d))'),
          ('General Relief & Welfare Fund', 'GENERAL', 'Unrestricted donations for public charitable activities and operations'),
          ('Annadanam & Food Distribution', 'ANNADANAM', 'Daily and festive mass meal distribution and hunger relief'),
          ('Healthcare & Free Medical Camps', 'MEDICAL', 'Medical aid, medicines distribution, and free diagnostics for underprivileged'),
          ('Education & Student Aid', 'EDUCATION', 'Scholarships, school fees, books, and uniforms for needy students'),
          ('Building & Infrastructure Fund', 'BUILDING', 'Development, maintenance, and expansion of trust community center'),
          ('Special Puja & Festival Offerings', 'FESTIVAL', 'Religious, spiritual, and community welfare events');
      `);
    }

    // 3. Donors / Benefactors Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS donors (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(200) NOT NULL,
        pan_or_id VARCHAR(50),
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Receipts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        receipt_number VARCHAR(100) NOT NULL UNIQUE,
        receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
        receipt_time VARCHAR(50),
        donor_id INT REFERENCES donors(id) ON DELETE SET NULL,
        donor_name VARCHAR(200) NOT NULL,
        donor_pan VARCHAR(50),
        donor_phone VARCHAR(50),
        donor_whatsapp VARCHAR(50),
        donor_email VARCHAR(100),
        donor_address TEXT,
        head_id INT REFERENCES account_heads(id) ON DELETE SET NULL,
        head_name VARCHAR(150) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        amount_words TEXT NOT NULL,
        payment_mode VARCHAR(50) NOT NULL, -- 'Cash', 'UPI', 'Cheque', 'Bank Transfer (NEFT/RTGS)', 'Online'
        cheque_or_tx_ref VARCHAR(100),
        bank_name VARCHAR(100),
        is_80g_claimed BOOLEAN DEFAULT true,
        notes TEXT,
        email_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Sent', 'Failed', 'Skipped'
        email_error TEXT,
        emailed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure receipts table has receipt_time column on existing databases
    await client.query(`
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_time VARCHAR(50);
    `);

    // Update existing receipts with null or 10:30 AM receipt_time to their creation time in IST
    await client.query(`
      UPDATE receipts 
      SET receipt_time = TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM')
      WHERE receipt_time IS NULL OR receipt_time = '10:30 AM';
    `);

    // 5. Audit / Dispatch Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispatch_logs (
        id SERIAL PRIMARY KEY,
        receipt_id INT REFERENCES receipts(id) ON DELETE CASCADE,
        channel VARCHAR(50) NOT NULL, -- 'Email', 'WhatsApp'
        recipient VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'Sent', 'Failed', 'Initiated'
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Users / Accounts Table (Donors & Admins)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        address TEXT,
        pan_or_id VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'donor', -- 'donor' or 'admin'
        donor_id INT REFERENCES donors(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure email is optional in users table for existing databases
    await client.query(`
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);

    await client.query(`
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS user_id INT;
    `);

    // Check if sample donor & receipt exists, if not create realistic initial demo data
    const resCount = await client.query('SELECT COUNT(*) FROM receipts');
    if (parseInt(resCount.rows[0].count) === 0) {
      // Seed initial donors
      const d1 = await client.query(`
        INSERT INTO donors (full_name, pan_or_id, phone, whatsapp, email, address)
        VALUES 
          ('Dr. Anand V. Kulkarni', 'ABCDE1234F', '+91 94481 23456', '919448123456', 'anand.kulkarni@example.com', '#108, 4th Cross, Malleshwaram, Bengaluru 560003'),
          ('Smt. Meenakshi Sundaram', 'BPXPS5678K', '+91 98860 98765', '919886098765', 'meenakshi.s@example.com', 'Flat 302, Sai Residency, Indiranagar, Bengaluru 560038'),
          ('Rajesh & Vandana Mehta', 'AAACM4321R', '+91 97412 55443', '919741255443', 'rajesh.mehta@example.com', '#22, Brigade Road, Ashok Nagar, Bengaluru 560025')
        RETURNING id;
      `);

      const donorId1 = d1.rows[0].id;
      const donorId2 = d1.rows[1].id;
      const donorId3 = d1.rows[2].id;

      // Dynamically fetch existing, valid account heads to avoid foreign key violations
      let headsRes = await client.query('SELECT id, name FROM account_heads ORDER BY id ASC');
      if (headsRes.rows.length === 0) {
        const seededHeads = await client.query(`
          INSERT INTO account_heads (name, code, description) VALUES
            ('Corpus Fund (Earmarked Capital)', 'CORPUS', 'Long-term corpus donation towards trust capital fund (exempt under Section 11(1)(d))'),
            ('General Relief & Welfare Fund', 'GENERAL', 'Unrestricted donations for public charitable activities and operations'),
            ('Annadanam & Food Distribution', 'ANNADANAM', 'Daily and festive mass meal distribution and hunger relief'),
            ('Healthcare & Free Medical Camps', 'MEDICAL', 'Medical aid, medicines distribution, and free diagnostics for underprivileged'),
            ('Education & Student Aid', 'EDUCATION', 'Scholarships, school fees, books, and uniforms for needy students'),
            ('Building & Infrastructure Fund', 'BUILDING', 'Development, maintenance, and expansion of trust community center'),
            ('Special Puja & Festival Offerings', 'FESTIVAL', 'Religious, spiritual, and community welfare events')
          RETURNING id, name;
        `);
        headsRes = seededHeads;
      }

      const h1 = headsRes.rows[0];
      const h2 = headsRes.rows[1] || h1;
      const h3 = headsRes.rows[2] || h1;

      // Seed initial receipts with dynamically verified head IDs
      await client.query(`
        INSERT INTO receipts (
          receipt_number, receipt_date, donor_id, donor_name, donor_pan, donor_phone, donor_whatsapp, donor_email, donor_address,
          head_id, head_name, amount, amount_words, payment_mode, cheque_or_tx_ref, bank_name, email_status
        ) VALUES 
          ($1, CURRENT_DATE - INTERVAL '5 days', $2, 'Dr. Anand V. Kulkarni', 'ABCDE1234F', '+91 94481 23456', '919448123456', 'anand.kulkarni@example.com', '#108, 4th Cross, Malleshwaram, Bengaluru 560003', $3, $4, 25000.00, 'Rupees Twenty Five Thousand Only', 'Bank Transfer (NEFT/RTGS)', 'UTR-NEFT982341238', 'State Bank of India', 'Sent'),
          ($5, CURRENT_DATE - INTERVAL '3 days', $6, 'Smt. Meenakshi Sundaram', 'BPXPS5678K', '+91 98860 98765', '919886098765', 'meenakshi.s@example.com', 'Flat 302, Sai Residency, Indiranagar, Bengaluru 560038', $7, $8, 5000.00, 'Rupees Five Thousand Only', 'UPI', 'UPI/261016/542198', 'GooglePay / HDFC Bank', 'Sent'),
          ($9, CURRENT_DATE - INTERVAL '1 days', $10, 'Rajesh & Vandana Mehta', 'AAACM4321R', '+91 97412 55443', '919741255443', 'rajesh.mehta@example.com', '#22, Brigade Road, Ashok Nagar, Bengaluru 560025', $11, $12, 15000.00, 'Rupees Fifteen Thousand Only', 'Cheque', 'CHQ #004512', 'ICICI Bank', 'Sent');
      `, [
        'TR/2026-27/0001', donorId1, h1.id, h1.name,
        'TR/2026-27/0002', donorId2, h2.id, h2.name,
        'TR/2026-27/0003', donorId3, h3.id, h3.name,
      ]);

      // Update next receipt number
      await client.query(`UPDATE trust_settings SET next_receipt_number = 1004 WHERE id = 1;`);
    }

    // Ensure default Admin user exists
    const adminCheck = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      const { hash, salt } = hashPassword('admin123');
      await client.query(`
        INSERT INTO users (full_name, email, phone, role, password_hash, password_salt)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, ['Bridge of Love Admin', 'admin@bridgeoflove.org', '+91 94441 00000', 'admin', hash, salt]);
    }

    // Ensure demo registered member exists for testing
    const memberCheck = await client.query("SELECT id FROM users WHERE email = 'anand.kulkarni@example.com'");
    if (memberCheck.rows.length === 0) {
      const donorRes = await client.query("SELECT id, full_name, phone, whatsapp, email, address, pan_or_id FROM donors WHERE email = 'anand.kulkarni@example.com' LIMIT 1");
      if (donorRes.rows.length > 0) {
        const d = donorRes.rows[0];
        const { hash, salt } = hashPassword('member123');
        const newUser = await client.query(`
          INSERT INTO users (full_name, email, phone, whatsapp, address, pan_or_id, role, donor_id, password_hash, password_salt)
          VALUES ($1, $2, $3, $4, $5, $6, 'donor', $7, $8, $9)
          RETURNING id
        `, [d.full_name, d.email, d.phone, d.whatsapp, d.address, d.pan_or_id, d.id, hash, salt]);
        await client.query('UPDATE donors SET user_id = $1 WHERE id = $2', [newUser.rows[0].id, d.id]);
      }
    }

    await client.query('COMMIT');
    console.log('PostgreSQL Database tables and schema verified successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL database:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase,
};
