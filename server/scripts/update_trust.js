const { query } = require('../db');

async function run() {
  try {
    await query(`
      UPDATE trust_settings SET 
        trust_name = 'BRIDGE OF LOVE',
        tagline = '"Humanity – Helping Hands"\n"Connecting Compassionate Hearts with People in Need"',
        address = 'Subramanya Nagar, Kambar Street, Bye-Pass Road,\nTiruttani – 631209, Tiruvallur District, Tamilnadu.',
        receipt_prefix = 'BOL/REC',
        signatory_name = 'Authorized Signatory',
        signatory_title = 'Issued by Bridge of Love (Team Members)',
        currency_symbol = '₹'
      WHERE id = 1;
    `);

    await query(`
      ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_time VARCHAR(20) DEFAULT TO_CHAR(CURRENT_TIMESTAMP, 'HH12:MI AM');
    `);

    await query(`UPDATE receipts SET receipt_time = '10:30 AM' WHERE receipt_time IS NULL;`);

    console.log('Database updated successfully for Bridge of Love.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
