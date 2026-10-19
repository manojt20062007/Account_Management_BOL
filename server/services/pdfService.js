const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../assets/logo.png');
const HANDS_HEART_PATH = path.join(__dirname, '../assets/hands_heart.png');
const SIGN_PATH = path.join(__dirname, '../assets/sign.png');
const MOTHER_PATH = path.join(__dirname, '../assets/mother.png');


/**
 * Generates an official vector PDF receipt dynamically using settings.
 */
function generateReceiptPdf(receipt, settings = {}) {
  return new Promise((resolve, reject) => {
    try {
      const trustName = settings.trust_name || 'BRIDGE OF LOVE';
      const currencySymbol = settings.currency_symbol || '₹';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        info: {
          Title: `Receipt_${receipt.receipt_number}`,
          Author: trustName,
          Subject: `${trustName} Payment Receipt`,
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2;

      // 1. Outer Dark Navy Border
      doc.rect(margin, margin, contentWidth, pageHeight - margin * 2)
        .lineWidth(2.5)
        .strokeColor('#003366')
        .stroke();

      // 1b. Background Watermark Image
      if (fs.existsSync(HANDS_HEART_PATH)) {
        const watermarkWidth = 500;
        const watermarkHeight = 350;
        const watermarkX = 50;
        // Position behind the main voucher body (Receipt No, Donor & Donation Details)
        const watermarkY = 465;
        doc.save();
        doc.opacity(0.10);
        doc.image(HANDS_HEART_PATH, watermarkX, watermarkY, { width: watermarkWidth, height: watermarkHeight });
        doc.restore();
      }

      let y = margin + 12;

      // 2. Header: Logos & Organization Details
      const logoWidth = 110;
      const logoHeight = 100;
      const hasLogo = fs.existsSync(LOGO_PATH);

      if (hasLogo) {
        doc.image(LOGO_PATH, margin + 12, y, { width: logoWidth, height: logoHeight });
      }
      if (fs.existsSync(MOTHER_PATH)) {
        const motherX = 460;
        const motherY = y - 8;
        const motherW = 98;
        const motherH = 100;
        const centerX = motherX + motherW / 2;
        const centerY = motherY + motherH / 2;
        const radiusX = motherW / 2;
        const radiusY = motherH / 2;

        // Clip image into elegant oval cameo
        doc.save();
        doc.ellipse(centerX, centerY, radiusX, radiusY).clip();
        doc.image(MOTHER_PATH, 460, 34, { width: motherW, height: motherH });
        doc.restore();

        // Draw elegant Navy oval shape border
        doc.ellipse(centerX, centerY, 45, 48)
          .lineWidth(1.5)
          .strokeColor('#003366')
          .stroke();
      }

      // Title & Mottos (100% Dynamic) with emblems before and next to trust name
      const headerTextWidth = contentWidth - 140;
      const headerTextX = margin + 70;

      doc.font('Helvetica-Bold').fontSize(16);
      const titleText = trustName.toUpperCase();
      const titleWidth = doc.widthOfString(titleText);
      const emblemSize = 50;
      const emblemGap = 6;
      const totalGroupWidth = titleWidth + (emblemSize * 2) + (emblemGap * 2);
      const startX = (pageWidth - totalGroupWidth) / 2;




      if (fs.existsSync(HANDS_HEART_PATH) && totalGroupWidth < headerTextWidth) {
        doc.image(HANDS_HEART_PATH, startX - 5, y - 1, { width: 60, height: emblemSize });
        doc.fillColor('#003366').text(titleText, startX + emblemSize + emblemGap, y, { lineBreak: false });
        doc.image(HANDS_HEART_PATH, startX - 1 + emblemSize + emblemGap + titleWidth + emblemGap, y - 4, { width: 60, height: emblemSize });
      } else {
        doc.fillColor('#003366').text(titleText, headerTextX, y, { align: 'center', width: headerTextWidth });
      }

      y += 20;
      const tamil1FontPath = path.join(__dirname, '../assets/latha1.ttf');
      const has1TamilFont = fs.existsSync(tamil1FontPath);
      if (has1TamilFont) {
        doc.registerFont('TamilFont', tamil1FontPath);
      }
      const xcord = 230;
      const ycord = 60;
      if (has1TamilFont) {
        doc.font('TamilFont').fontSize(15).fillColor('#003366')
          .text('அன்பின் பாலம்', xcord, ycord);
      }
      y += 25;

      // Dynamic Tagline / Mission lines
      if (settings.tagline) {
        const taglines = settings.tagline.split(/\n|\|/).map(t => t.trim()).filter(Boolean);
        taglines.forEach((tag, idx) => {
          doc.font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(idx % 2 === 0 ? '#1e293b' : '#b91c1c')
            .text(tag.startsWith('“') || tag.startsWith('"') ? tag : `“${tag}”`, headerTextX, y, { align: 'center', width: headerTextWidth });
          y += 14;
        });
      }

      // Dynamic Address
      if (settings.address) {
        doc.font('Helvetica')
          .fontSize(8.5)
          .fillColor('#334155')
          .text('Subramanya Nagar, Kambar Street, Bye-Pass Road', headerTextX, y, { align: 'center', width: headerTextWidth });

        y += 16;
      }
      if (settings.address) {
        doc.font('Helvetica')
          .fontSize(8.5)
          .fillColor('#334155')
          .text('Tiruttani – 631209, Tiruvallur District, Tamilnadu.', headerTextX, y, { align: 'center', width: headerTextWidth });

        y += 15;
      }

      // Dynamic Contact & Registration Info
      const metaParts = [];


      if (metaParts.length > 0) {
        doc.font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text(metaParts.join('  •  '), headerTextX, y, { align: 'center', width: headerTextWidth });
        y += 14;
      }

      y += 8;

      // 3. Payment Receipt Banner
      const bannerHeight = 28;
      doc.rect(margin + 16, y, contentWidth - 32, bannerHeight)
        .fillColor('#f1f5f9')
        .fill();

      doc.font('Helvetica-Bold')
        .fontSize(15)
        .fillColor('#003366')
        .text('PAYMENT RECEIPT', margin + 16, y + 7, { align: 'center', width: contentWidth - 32, characterSpacing: 1 });

      y += bannerHeight + 14;

      // 4. Metadata Box (Receipt No, Date, Time)
      const tableX = margin + 16;
      const tableWidth = contentWidth - 32;
      const colWidth = tableWidth / 3;

      // Metadata Header
      doc.rect(tableX, y, tableWidth, 22).fillColor('#f8fafc').fill();
      doc.rect(tableX, y, tableWidth, 22).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#003366');
      doc.text('Receipt  No.', tableX + 12, y + 7);
      doc.text('Date', tableX + colWidth, y + 7, { align: 'center', width: colWidth });
      doc.text('Time', tableX + colWidth * 2, y + 7, { align: 'center', width: colWidth });
      y += 22;

      // Metadata Values
      doc.rect(tableX, y, tableWidth, 24).fillColor('#ffffff').fill();
      doc.rect(tableX, y, tableWidth, 24).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      const formattedDate = new Date(receipt.receipt_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      let formattedTime = receipt.receipt_time;
      if (!formattedTime && receipt.created_at) {
        try {
          formattedTime = new Date(receipt.created_at).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        } catch (e) {
          formattedTime = null;
        }
      }
      if (!formattedTime) {
        formattedTime = new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a');
      doc.text(receipt.receipt_number, tableX + 12, y + 7);
      doc.text(formattedDate, tableX + colWidth, y + 7, { align: 'center', width: colWidth });
      doc.text(formattedTime, tableX + colWidth * 2, y + 7, { align: 'center', width: colWidth });
      y += 24 + 10;

      // Helper function to draw table section
      const drawBanner = (title, curY) => {
        doc.rect(tableX, curY, tableWidth, 22).fillColor('#003366').fill();
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff')
          .text(title, tableX, curY + 6, { align: 'center', width: tableWidth, characterSpacing: 0.8 });
        return curY + 22;
      };

      const drawRow = (label, value, curY, rowHeight = 24) => {
        doc.rect(tableX, curY, tableWidth, rowHeight).fillColor('#ffffff').fill();
        doc.rect(tableX, curY, tableWidth, rowHeight).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a')
          .text(label, tableX + 12, curY + 7);

        doc.font('Helvetica').fontSize(9).fillColor('#1e293b')
          .text(value || '—', tableX + 140, curY + 7, { width: tableWidth - 150 });

        return curY + rowHeight;
      };

      // 5. Section: DONOR DETAILS
      y = drawBanner('DONOR DETAILS', y);
      y = drawRow('Donor Name', receipt.donor_name, y, 26);

      const contactLine = [receipt.donor_phone, receipt.donor_email].filter(Boolean).join('  /  ') || '—';
      y = drawRow('Phone / Email', contactLine, y, 26);
      y = drawRow('Address', receipt.donor_address || '—', y, 36);

      y += 10;

      // 6. Section: DONATION DETAILS
      y = drawBanner('DONATION DETAILS', y);

      const amtVal = `${parseFloat(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      y = drawRow(`Amount (${settings.currency_code || 'INR'})`, amtVal, y, 26);
      y = drawRow('Amount in words', receipt.amount_words, y, 28);
      y = drawRow('Payment mode', receipt.payment_mode, y, 26);

      const refLine = [receipt.cheque_or_tx_ref, receipt.bank_name].filter(Boolean).join(' - ') || '—';
      y = drawRow('Transaction / ref.', refLine, y, 26);

      y += 30;

      // 7. Footer: Received By & Signatures (100% Dynamic)
      const sigLine1X = pageWidth - margin - 220;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a')
        .text('Received by', sigLine1X, y - 20, { width: 190, align: 'center' });





      // 1b. Background Watermark Image
      if (fs.existsSync(HANDS_HEART_PATH)) {
        const watermarkWidth = 500;
        const watermarkHeight = 350;
        const watermarkX = 50;
        // Position behind the main voucher body (Receipt No, Donor & Donation Details)
        const watermarkY = 465;
        doc.save();
        doc.opacity(0.20);
        doc.image(HANDS_HEART_PATH, watermarkX, watermarkY, { width: watermarkWidth, height: watermarkHeight });
        doc.restore();
      }
      // Signature line on the right
      const sigLineX = pageWidth - margin - 220;

      // sign (100% full opacity, bold & dark)
      if (fs.existsSync(SIGN_PATH)) {
        const signWidth = 60;
        const signHeight = 40;
        const signX = 411;
        const signY = 518;
        doc.save();
        doc.opacity(2.0);
        doc.image(SIGN_PATH, signX, signY, { width: signWidth, height: signHeight });
        doc.restore();
      }

      if (settings.signatory_name) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a')
          .text(settings.signatory_name, sigLineX, y + 30, { width: 190, align: 'center' });
      }

      // 8. OUR VISION & OUR MISSION 2-Column Banner Card
      const boxY = y + 50;
      const boxWidth = tableWidth;
      const boxHeight = 120;
      const boxX = tableX;

      // Card Outer Border (Transparent Background)
      // Middle Vertical Divider Line
      const midDividerX = boxX + boxWidth / 2;
      doc.moveTo(midDividerX, boxY + 10)


      const colInnerWidth = (boxWidth / 2) - 24;
      const tamilFontPath = path.join(__dirname, '../assets/latha.ttf');
      const hasTamilFont = fs.existsSync(tamilFontPath);
      if (hasTamilFont) {
        doc.registerFont('TamilFont', tamilFontPath);
      }

      // --- LEFT COLUMN: OUR VISION ---
      const col1X = boxX + 12;
      // Target Icon (Vector concentric circles, transparent)


      doc.font('Helvetica-Bold').fontSize(10).fillColor('#881337')
        .text('                        OUR VISION', col1X + 20, boxY + 11);

      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#1e293b')
        .text('“To build an inclusive and empathetic society where no individual is left behind in suffering, bridging the gap between privilege and poverty through unconditional love, mutual respect, and selfless service.”', col1X, boxY + 28, {
          width: colInnerWidth,
          style: 'bold',
          align: 'center',
          lineGap: 2.2,
        });

      if (hasTamilFont) {
        doc.font('TamilFont').fontSize(7.5).fillColor('#475569')
          .text('“அன்பும் இரக்கமும் நிறைந்த ஒரு சமூகத்தை உருவாக்குதல்; நலிந்த மற்றும் வறிய மக்களின் துயர் துடைத்து வாழ்வொளி ஏற்றுதல்.”', col1X, boxY + 76, {
            width: colInnerWidth,
            style: 'bold',
            align: 'center',
            lineGap: 1.5,
          });
      }

      // --- RIGHT COLUMN: OUR MISSION ---
      const col2X = midDividerX + 12;
      // People Icon (Vector 3 silhouettes)


      doc.font('Helvetica-Bold').fontSize(10).fillColor('#881337')
        .text('                      OUR MISSION', col2X + 20, boxY + 11);

      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#1e293b')
        .text('“To connect compassionate hearts with people in need—extending immediate relief, educational aid, and essential sustenance to underserved communities with total transparency, dignity, and collective action.”', col2X, boxY + 28, {
          width: colInnerWidth,
          style: 'bold',
          align: 'center',
          lineGap: 2.2,
        });

      if (hasTamilFont) {
        doc.font('TamilFont').fontSize(7.2).fillColor('#475569')
          .text('“தேவைப்படுவோருக்கு கல்வி, உதவி மற்றும் ஆதரவை வழங்கி, மனிதநேயமிக்க கரங்களை ஒன்றிணைத்து சமுதாயத்தை மேம்படுத்துதல்.”', col2X, boxY + 76, {
            width: colInnerWidth,
            align: 'center',
            lineGap: 1.5,
          });
      }

      y = boxY + boxHeight + 22;

      // Thank You Message in Green

      doc.font('Helvetica-Bold')
        .fontSize(12.5)
        .fillColor('#15803d')
        .text('Thank you for your generous contribution.', margin, y, { align: 'center', width: contentWidth });

      y += 35;

      // Sub-footer text in Navy (Dynamic Signatory Title)
      const footerSignTitle = settings.signatory_title || `Issued by ${trustName} (Team Members)`;
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#003366')
        .text(footerSignTitle, margin, y, { align: 'center', width: contentWidth });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * ONE-CLICK PDF GENERATOR FOR ALL ACCOUNTS (100% Dynamic with settings)
 */
function generateAllAccountsPdf(receipts, settings = {}) {
  return new Promise((resolve, reject) => {
    try {
      const trustName = settings.trust_name || 'BRIDGE OF LOVE';
      const currencySymbol = settings.currency_symbol || '₹';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        bufferPages: true,
        info: {
          Title: `${trustName.replace(/\s+/g, '_')}_All_Accounts_Statement_${new Date().toISOString().slice(0, 10)}`,
          Author: trustName,
          Subject: `${trustName} — Complete Accounts & Receipts Statement`,
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2;

      // PAGE 1: TITLE & EXECUTIVE FINANCIAL SUMMARY
      doc.rect(margin, margin, contentWidth, 80).fillColor('#003366').fill();

      const hasLogo = fs.existsSync(LOGO_PATH);
      if (hasLogo) {
        doc.image(LOGO_PATH, margin + 14, margin + 16, { width: 48, height: 48 });
      }

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff')
        .text(trustName.toUpperCase(), margin + 70, margin + 16, { align: 'center', width: contentWidth - 140 });

      if (settings.tagline) {
        doc.font('Helvetica').fontSize(9).fillColor('#cbd5e1')
          .text(settings.tagline.replace(/\n/g, '  •  '), margin + 70, margin + 38, { align: 'center', width: contentWidth - 140, lineBreak: false });
      }

      if (settings.address) {
        doc.font('Helvetica').fontSize(8.5).fillColor('#94a3b8')
          .text(settings.address.replace(/\n/g, ', '), margin + 70, margin + 52, { align: 'center', width: contentWidth - 140, lineBreak: false });
      }

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#38bdf8')
        .text('CONSOLIDATED ALL ACCOUNTS & RECEIPTS STATEMENT', margin + 70, margin + 65, { align: 'center', width: contentWidth - 140 });

      let y = margin + 95;

      // Metadata Bar
      doc.rect(margin, y, contentWidth, 24).fillColor('#f1f5f9').fill();
      doc.rect(margin, y, contentWidth, 24).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
      doc.text(`Generated On: ${new Date().toLocaleString('en-IN')}`, margin + 12, y + 7);
      doc.text(`Total Accounts Records: ${receipts.length}`, margin + 260, y + 7);
      doc.text(`Scope: All Accounts & Funds`, pageWidth - margin - 180, y + 7, { width: 170, align: 'right' });
      y += 34;

      // Executive Metrics Cards
      const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const cardWidth = (contentWidth - 20) / 3;

      // Total Collections
      doc.rect(margin, y, cardWidth, 60).fillColor('#f8fafc').fill();
      doc.rect(margin, y, cardWidth, 60).lineWidth(1).strokeColor('#003366').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('TOTAL CONTRIBUTIONS', margin + 12, y + 10);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#003366')
        .text(`${currencySymbol} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 12, y + 24);
      doc.font('Helvetica').fontSize(7.5).fillColor('#15803d').text('Audited Inflows in Books', margin + 12, y + 44);

      // Total Receipts
      doc.rect(margin + cardWidth + 10, y, cardWidth, 60).fillColor('#f8fafc').fill();
      doc.rect(margin + cardWidth + 10, y, cardWidth, 60).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('TOTAL TRANSACTIONS', margin + cardWidth + 22, y + 10);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a')
        .text(`${receipts.length} Vouchers Issued`, margin + cardWidth + 22, y + 24);
      const uniqueDonors = new Set(receipts.map(r => r.donor_name)).size;
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(`Across ${uniqueDonors} Unique Donors`, margin + cardWidth + 22, y + 44);

      // Trust Status
      doc.rect(margin + (cardWidth + 10) * 2, y, cardWidth, 60).fillColor('#f8fafc').fill();
      doc.rect(margin + (cardWidth + 10) * 2, y, cardWidth, 60).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('ORGANIZATION', margin + (cardWidth + 10) * 2 + 12, y + 10);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#003366').text(trustName, margin + (cardWidth + 10) * 2 + 12, y + 26);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(settings.address ? settings.address.slice(0, 35) : 'Official Office', margin + (cardWidth + 10) * 2 + 12, y + 44);

      y += 72;

      // Payment Mode Distribution
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#003366').text('1. Payment Mode & Collection Summary', margin, y);
      y += 16;

      doc.rect(margin, y, contentWidth, 20).fillColor('#003366').fill();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
      doc.text('Payment Method', margin + 10, y + 6);
      doc.text('Transactions', margin + 260, y + 6);
      doc.text(`Total Amount (${currencySymbol})`, margin + 370, y + 6);
      y += 20;

      const modeMap = {};
      receipts.forEach(r => {
        const m = r.payment_mode || 'Cash';
        if (!modeMap[m]) modeMap[m] = { count: 0, total: 0 };
        modeMap[m].count += 1;
        modeMap[m].total += parseFloat(r.amount);
      });

      let isEven = false;
      Object.keys(modeMap).forEach(m => {
        const data = modeMap[m];
        doc.rect(margin, y, contentWidth, 18).fillColor(isEven ? '#f8fafc' : '#ffffff').fill();
        doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(m, margin + 10, y + 5);
        doc.text(`${data.count}`, margin + 260, y + 5);
        doc.font('Helvetica-Bold').text(`${currencySymbol} ${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 370, y + 5);
        y += 18;
        isEven = !isEven;
      });

      // SECTION 2: ALL ACCOUNTS DAYBOOK / RECEIPT VOUCHERS
      doc.addPage();
      y = margin;

      doc.font('Helvetica-Bold').fontSize(12).fillColor('#003366')
        .text('2. Complete Itemized Daybook & Member Vouchers (All Accounts)', margin, y);
      y += 18;

      const drawTableHeader = (curY) => {
        doc.rect(margin, curY, contentWidth, 22).fillColor('#003366').fill();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        doc.text('Rec. No', margin + 6, curY + 7);
        doc.text('Date', margin + 80, curY + 7);
        doc.text('Donor & Contact', margin + 135, curY + 7);
        doc.text('Payment Mode', margin + 290, curY + 7);
        doc.text('Ref / Bank', margin + 395, curY + 7);
        doc.text(`Amount (${currencySymbol})`, pageWidth - margin - 75, curY + 7, { width: 70, align: 'right' });
        return curY + 22;
      };

      y = drawTableHeader(y);

      isEven = false;
      receipts.forEach((r) => {
        if (y > pageHeight - margin - 45) {
          doc.addPage();
          y = margin;
          y = drawTableHeader(y);
        }

        const rowHeight = 24;
        doc.rect(margin, y, contentWidth, rowHeight).fillColor(isEven ? '#f8fafc' : '#ffffff').fill();
        doc.rect(margin, y, contentWidth, rowHeight).lineWidth(0.25).strokeColor('#e2e8f0').stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(r.receipt_number, margin + 6, y + 4);
        doc.font('Helvetica').fontSize(7.5).fillColor('#475569')
          .text(new Date(r.receipt_date).toLocaleDateString('en-IN'), margin + 80, y + 4);

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b')
          .text(r.donor_name, margin + 135, y + 4, { width: 145, ellipsis: true });
        if (r.donor_phone || r.donor_email) {
          doc.font('Helvetica').fontSize(7).fillColor('#64748b')
            .text(r.donor_phone || r.donor_email, margin + 135, y + 14);
        }

        doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
          .text(r.payment_mode, margin + 290, y + 4);

        const refText = [r.cheque_or_tx_ref, r.bank_name].filter(Boolean).join(' - ') || '—';
        doc.font('Helvetica').fontSize(7).fillColor('#64748b')
          .text(refText, margin + 395, y + 4, { width: 80, ellipsis: true });

        const rowAmt = parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#003366')
          .text(`${currencySymbol} ${rowAmt}`, pageWidth - margin - 75, y + 6, { width: 70, align: 'right' });

        y += rowHeight;
        isEven = !isEven;
      });

      // Total Row
      if (y > pageHeight - margin - 60) {
        doc.addPage();
        y = margin;
      }

      y += 8;
      doc.rect(margin, y, contentWidth, 26).fillColor('#003366').fill();
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
        .text('GRAND TOTAL FOR ALL ACCOUNTS:', margin + 15, y + 8);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#38bdf8')
        .text(`${currencySymbol} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 150, y + 7, { width: 140, align: 'right' });

      y += 44;

      // Verification certification (Dynamic)
      if (y > pageHeight - margin - 75) {
        doc.addPage();
        y = margin;
      }

      doc.rect(margin, y, contentWidth, 65).fillColor('#f8fafc').fill();
      doc.rect(margin, y, contentWidth, 65).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#003366')
        .text('AUDIT & TRUSTEE CERTIFICATION', margin + 15, y + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#475569')
        .text(`Certified that the above consolidated statement of all accounts and receipt vouchers reflects a true and complete record of all contributions received by ${trustName}.`, margin + 15, y + 22, { width: 330 });

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#003366')
        .text(`For ${trustName}`, pageWidth - margin - 180, y + 8, { align: 'center', width: 160 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a')
        .text(settings.signatory_name || 'Authorized Signatory', pageWidth - margin - 180, y + 42, { align: 'center', width: 160 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b')
        .text(settings.signatory_title || 'Trust Committee', pageWidth - margin - 180, y + 52, { align: 'center', width: 160 });

      // Add page numbering
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
          .text(`Page ${i + 1} of ${range.count}   |   ${trustName} — All Accounts Statement`, margin, pageHeight - margin + 8, { align: 'center', width: contentWidth });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateReceiptPdf,
  generateAllAccountsPdf,
};
