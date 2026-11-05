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
      const trustName = settings.trust_name || 'Anbin Unavu';
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
      // position of left logo
      if (hasLogo) {
        doc.image(LOGO_PATH, margin + 12, y, { width: logoWidth, height: logoHeight });
      }
      if (fs.existsSync(MOTHER_PATH)) {
        const motherX = 440;
        const motherY = y - 15;
        const motherW = 110;
        const motherH = 100;
        const centerX = motherX + motherW / 2;
        const centerY = motherY + motherH / 2;
        const radiusX = motherW / 2;
        const radiusY = motherH / 2;



        // Draw elegant Navy oval shape border
        // Clip image into elegant oval cameo
        doc.save();

        doc.image(MOTHER_PATH, 450, margin+12, { width: motherW, height: motherH });
        doc.restore();
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
        doc.image(HANDS_HEART_PATH, startX - 14, y - 1, { width: 60, height: emblemSize });
        doc.fillColor('#003366').text(titleText, startX + emblemSize + emblemGap, y, { lineBreak: false });
        doc.image(HANDS_HEART_PATH, startX + 4 + emblemSize + emblemGap + titleWidth + emblemGap, y - 4, { width: 60, height: emblemSize });
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
          .text('அன்பின் உணவு', xcord, ycord);
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
          .text('Subramanya Nagar, Bye-Pass Road', headerTextX, y, { align: 'center', width: headerTextWidth });

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

      let formattedDate = '';
      if (receipt.receipt_date) {
        try {
          const d = new Date(receipt.receipt_date);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
          }
        } catch (e) {
          formattedDate = '';
        }
      }

      let formattedTime = receipt.receipt_time || '';
      if (!formattedTime && receipt.created_at) {
        try {
          formattedTime = new Date(receipt.created_at).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        } catch (e) {
          formattedTime = '';
        }
      }

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a');
      doc.text(receipt.receipt_number || '', tableX + 12, y + 7);
      doc.text(formattedDate || '', tableX + colWidth, y + 7, { align: 'center', width: colWidth });
      doc.text(formattedTime || '', tableX + colWidth * 2, y + 7, { align: 'center', width: colWidth });
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
          .text(value || '', tableX + 140, curY + 7, { width: tableWidth - 150 });

        return curY + rowHeight;
      };

      // 5. Section: DONOR DETAILS
      y = drawBanner('DONOR DETAILS', y);
      y = drawRow('Donor Name', receipt.donor_name || '', y, 26);

      const contactLine = [receipt.donor_phone, receipt.donor_email].filter(Boolean).join('  /  ') || '';
      y = drawRow('Phone / Email', contactLine, y, 26);
      y = drawRow('Address', receipt.donor_address || '', y, 36);

      y += 10;

      // 6. Section: DONATION DETAILS
      y = drawBanner('DONATION DETAILS', y);

      const amtVal = (receipt.amount && !isNaN(parseFloat(receipt.amount)))
        ? `${parseFloat(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : '';
      y = drawRow(`Amount (${settings.currency_code || 'INR'})`, amtVal, y, 26);
      y = drawRow('Amount in words', receipt.amount_words || '', y, 28);
      y = drawRow('Payment mode', receipt.payment_mode || '', y, 26);

      const refLine = [receipt.cheque_or_tx_ref, receipt.bank_name].filter(Boolean).join(' - ') || '';
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
 * Polished, high-definition executive statement layout with zero ghost pages.
 */
function generateAllAccountsPdf(receipts, settings = {}) {
  return new Promise((resolve, reject) => {
    try {
      const trustName = settings.trust_name || 'Anbin Unavu';
      // Format currency: Use "Rs." in standard PostScript fonts to prevent broken '¹' glyph in Helvetica
      const currCode = 'Rs.';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 24,
        bufferPages: true,
        info: {
          Title: `${trustName.replace(/\s+/g, '_')}_All_Accounts_Statement_${new Date().toISOString().slice(0, 10)}`,
          Author: trustName,
          Subject: `${trustName} Consolidated Statement of All Accounts`,
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;

      // Register Tamil font if available
      const tamilFontPath = path.join(__dirname, '../assets/latha1.ttf');
      const hasTamilFont = fs.existsSync(tamilFontPath);
      if (hasTamilFont) {
        doc.registerFont('TamilFont', tamilFontPath);
      }

      // Helper to draw watermark
      const drawWatermark = () => {
        if (fs.existsSync(HANDS_HEART_PATH)) {
          doc.save();
          doc.opacity(0.06);
          const wmWidth = 420;
          const wmHeight = 300;
          doc.image(HANDS_HEART_PATH, (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, {
            width: wmWidth,
            height: wmHeight,
          });
          doc.restore();
        }
      };

      // Helper to draw outer frame border
      const drawPageFrame = () => {
        doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin * 2) + 8)
          .lineWidth(1)
          .strokeColor('#003366')
          .stroke();
      };

      // First Page setup
      drawWatermark();
      drawPageFrame();

      // =========================================================================
      // 1. EXECUTIVE HEADER
      // =========================================================================
      const headerHeight = 84;
      doc.rect(margin, margin, contentWidth, headerHeight).fillColor('#00264d').fill();

      // Left: Logo
      const hasLogo = fs.existsSync(LOGO_PATH);
      if (hasLogo) {
        doc.circle(margin + 36, margin + 42, 28).fillColor('#ffffff').fill();
        doc.image(LOGO_PATH, margin + 11, margin + 17, { width: 50, height: 50 });
      }

      // Right: Mother Teresa Cameo Oval
      const hasMother = fs.existsSync(MOTHER_PATH);
      const motherCameoW = 48;
      const motherCameoH = 58;
      const motherCenterX = pageWidth - margin - 38;
      const motherCenterY = margin + 42;

      if (hasMother) {
        doc.save();
        doc.ellipse(motherCenterX, motherCenterY, motherCameoW / 2, motherCameoH / 2).clip();
        doc.image(MOTHER_PATH, motherCenterX - motherCameoW / 2, motherCenterY - motherCameoH / 2, {
          width: motherCameoW,
          height: motherCameoH,
        });
        doc.restore();

        // Elegant Gold/Navy Oval Ring
        doc.ellipse(motherCenterX, motherCenterY, motherCameoW / 2 + 1, motherCameoH / 2 + 1)
          .lineWidth(1.5)
          .strokeColor('#fde68a')
          .stroke();
      }

      // Center: Trust Titles & Mottos
      const centerStartX = margin + 74;
      const centerWidth = contentWidth - 148;
      let curY = margin + 8;

      if (hasTamilFont) {
        doc.font('TamilFont').fontSize(11).fillColor('#93c5fd')
          .text('அன்பின் உணவு', centerStartX, curY, { align: 'center', width: centerWidth });
        curY += 14;
      } else {
        curY += 2;
      }

      doc.font('Helvetica-Bold').fontSize(15).fillColor('#ffffff')
        .text(trustName.toUpperCase(), centerStartX, curY, { align: 'center', width: centerWidth, characterSpacing: 1 });
      curY += 18;

      if (settings.tagline) {
        doc.font('Helvetica').fontSize(7.5).fillColor('#fde68a')
          .text(settings.tagline.replace(/\n/g, '  •  '), centerStartX, curY, { align: 'center', width: centerWidth });
        curY += 11;
      }

      if (settings.address) {
        doc.font('Helvetica').fontSize(7).fillColor('#cbd5e1')
          .text(settings.address.replace(/\n/g, ', '), centerStartX, curY, { align: 'center', width: centerWidth });
        curY += 11;
      }

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#38bdf8')
        .text('CONSOLIDATED ALL ACCOUNTS & RECEIPTS STATEMENT', centerStartX, curY, { align: 'center', width: centerWidth, characterSpacing: 0.5 });

      curY = margin + headerHeight + 6;

      // =========================================================================
      // 2. METADATA RIBBON
      // =========================================================================
      const metaHeight = 20;
      doc.rect(margin, curY, contentWidth, metaHeight).fillColor('#f1f5f9').fill();
      doc.rect(margin, curY, contentWidth, metaHeight).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      const genTimeStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
      doc.text(`Generated: ${genTimeStr}`, margin + 10, curY + 6);
      doc.text(`Total Accounts Records: ${receipts.length} Vouchers`, margin + 200, curY + 6);
      doc.text(`Scope: All Accounts & Funds (Audited)`, pageWidth - margin - 200, curY + 6, { width: 190, align: 'right' });

      curY += metaHeight + 8;

      // =========================================================================
      // 3. EXECUTIVE KPI CARDS (3-COLUMN)
      // =========================================================================
      const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const uniqueDonors = new Set(receipts.map(r => r.donor_name)).size;
      const cardHeight = 48;
      const gap = 8;
      const cardW = (contentWidth - gap * 2) / 3;

      // Card 1: Total Contributions
      doc.rect(margin, curY, cardW, cardHeight).fillColor('#f8fafc').fill();
      doc.rect(margin, curY, cardW, cardHeight).lineWidth(1).strokeColor('#003366').stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text('TOTAL CONTRIBUTIONS', margin + 10, curY + 7);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#003366')
        .text(`${currCode} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 10, curY + 18);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#16a34a').text('✓ Reconciled Inflows in Books', margin + 10, curY + 34);

      // Card 2: Total Transactions
      const card2X = margin + cardW + gap;
      doc.rect(card2X, curY, cardW, cardHeight).fillColor('#f8fafc').fill();
      doc.rect(card2X, curY, cardW, cardHeight).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text('TOTAL TRANSACTIONS', card2X + 10, curY + 7);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a')
        .text(`${receipts.length} Vouchers Issued`, card2X + 10, curY + 18);
      doc.font('Helvetica').fontSize(7).fillColor('#475569').text(`Across ${uniqueDonors} Unique Donors`, card2X + 10, curY + 34);

      // Card 3: Organization Details
      const card3X = margin + (cardW + gap) * 2;
      doc.rect(card3X, curY, cardW, cardHeight).fillColor('#f8fafc').fill();
      doc.rect(card3X, curY, cardW, cardHeight).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text('ORGANIZATION', card3X + 10, curY + 7);
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#003366').text(trustName, card3X + 10, curY + 19);
      doc.font('Helvetica').fontSize(7).fillColor('#475569').text('Tiruttani – 631209, Tamil Nadu', card3X + 10, curY + 34);

      curY += cardHeight + 10;

      // =========================================================================
      // 4. SECTION 1: PAYMENT MODE DISTRIBUTION SUMMARY
      // =========================================================================
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#003366')
        .text('1. Payment Mode & Collection Summary', margin, curY);
      curY += 12;

      // Table Header for Mode Distribution
      const modeHeaderH = 16;
      doc.rect(margin, curY, contentWidth, modeHeaderH).fillColor('#003366').fill();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
      doc.text('Payment Method', margin + 10, curY + 4);
      doc.text('Vouchers Count', margin + 200, curY + 4);
      doc.text('Share (%)', margin + 320, curY + 4);
      doc.text(`Total Amount (${currCode})`, pageWidth - margin - 120, curY + 4, { width: 110, align: 'right' });
      curY += modeHeaderH;

      const modeMap = {};
      receipts.forEach(r => {
        const m = r.payment_mode || 'Cash';
        if (!modeMap[m]) modeMap[m] = { count: 0, total: 0 };
        modeMap[m].count += 1;
        modeMap[m].total += parseFloat(r.amount || 0);
      });

      const modeRowH = 15;
      let isEven = false;
      Object.keys(modeMap).forEach(m => {
        const data = modeMap[m];
        const sharePct = totalAmount > 0 ? ((data.total / totalAmount) * 100).toFixed(1) : '0.0';
        doc.rect(margin, curY, contentWidth, modeRowH).fillColor(isEven ? '#f8fafc' : '#ffffff').fill();
        doc.rect(margin, curY, contentWidth, modeRowH).lineWidth(0.25).strokeColor('#e2e8f0').stroke();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b').text(m, margin + 10, curY + 4);
        doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(`${data.count} ${data.count === 1 ? 'Voucher' : 'Vouchers'}`, margin + 200, curY + 4);
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`${sharePct}%`, margin + 320, curY + 4);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#003366')
          .text(`${currCode} ${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 120, curY + 4, { width: 110, align: 'right' });

        curY += modeRowH;
        isEven = !isEven;
      });

      curY += 10;

      // =========================================================================
      // 5. SECTION 2: ITEMIZED DAYBOOK & MEMBER VOUCHERS
      // =========================================================================
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#003366')
        .text('2. Complete Itemized Daybook & Member Vouchers (All Accounts)', margin, curY);
      curY += 13;

      const colX = {
        recNo: margin + 6,
        recNoW: 108,
        date: margin + 116,
        dateW: 56,
        donor: margin + 174,
        donorW: 140,
        mode: margin + 316,
        modeW: 64,
        ref: margin + 382,
        refW: 82,
        amt: margin + 466,
        amtW: 75,
      };

      const drawDaybookHeader = (yPos) => {
        const hHeight = 18;
        doc.rect(margin, yPos, contentWidth, hHeight).fillColor('#003366').fill();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        doc.text('Rec. No', colX.recNo, yPos + 5);
        doc.text('Date', colX.date, yPos + 5);
        doc.text('Donor & Contact', colX.donor, yPos + 5);
        doc.text('Mode', colX.mode, yPos + 5);
        doc.text('Ref / Bank', colX.ref, yPos + 5);
        doc.text(`Amount (${currCode})`, colX.amt, yPos + 5, { width: colX.amtW, align: 'right' });
        return yPos + hHeight;
      };

      curY = drawDaybookHeader(curY);

      const rowH = 24;
      isEven = false;

      receipts.forEach((r) => {
        // Break to next page safely before bottom boundary
        if (curY + rowH > pageHeight - margin - 85) {
          doc.addPage();
          drawWatermark();
          drawPageFrame();
          curY = margin + 10;
          curY = drawDaybookHeader(curY);
        }

        doc.rect(margin, curY, contentWidth, rowH).fillColor(isEven ? '#f8fafc' : '#ffffff').fill();
        doc.rect(margin, curY, contentWidth, rowH).lineWidth(0.25).strokeColor('#e2e8f0').stroke();

        // Rec No
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a')
          .text(r.receipt_number || '—', colX.recNo, curY + 6, { width: colX.recNoW, lineBreak: false });

        // Date
        let dateStr = '—';
        if (r.receipt_date) {
          const d = new Date(r.receipt_date);
          dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN') : String(r.receipt_date);
        }
        doc.font('Helvetica').fontSize(7).fillColor('#475569')
          .text(dateStr, colX.date, curY + 6);

        // Donor & Phone
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b')
          .text(r.donor_name || '—', colX.donor, curY + 4, { width: colX.donorW, ellipsis: true });
        if (r.donor_phone || r.donor_email) {
          doc.font('Helvetica').fontSize(6.5).fillColor('#64748b')
            .text(r.donor_phone || r.donor_email, colX.donor, curY + 13, { width: colX.donorW, ellipsis: true });
        }

        // Clean Payment Mode to fit comfortably
        const rawMode = r.payment_mode || 'Cash';
        const formattedMode = rawMode
          .replace(/Bank Transfer\s*\(NEFT\/RTGS\)/i, 'NEFT / RTGS')
          .replace(/\(NEFT\/RTGS\)/i, '')
          .trim();
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
          .text(formattedMode, colX.mode, curY + 6, { width: colX.modeW, ellipsis: true });

        // Ref / Bank on 2 clean lines
        const refPart = (r.cheque_or_tx_ref || '').trim();
        const bankPart = (r.bank_name || '').trim();
        if (refPart && bankPart) {
          doc.font('Helvetica').fontSize(6.5).fillColor('#475569')
            .text(refPart, colX.ref, curY + 4, { width: colX.refW, ellipsis: true });
          doc.font('Helvetica').fontSize(6).fillColor('#64748b')
            .text(bankPart, colX.ref, curY + 13, { width: colX.refW, ellipsis: true });
        } else {
          doc.font('Helvetica').fontSize(6.5).fillColor('#64748b')
            .text(refPart || bankPart || '—', colX.ref, curY + 6, { width: colX.refW, ellipsis: true });
        }

        // Amount
        const rowAmt = parseFloat(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#003366')
          .text(`${currCode} ${rowAmt}`, colX.amt, curY + 6, { width: colX.amtW, align: 'right' });

        curY += rowH;
        isEven = !isEven;
      });

      // GRAND TOTAL ROW
      if (curY + 24 > pageHeight - margin - 75) {
        doc.addPage();
        drawWatermark();
        drawPageFrame();
        curY = margin + 10;
      }

      const totalRowH = 22;
      doc.rect(margin, curY, contentWidth, totalRowH).fillColor('#00264d').fill();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff')
        .text(`GRAND TOTAL FOR ALL ACCOUNTS (${receipts.length} Vouchers):`, margin + 12, curY + 6);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#38bdf8')
        .text(`${currCode} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, colX.amt - 40, curY + 6, { width: colX.amtW + 40, align: 'right' });

      curY += totalRowH + 10;

      // =========================================================================
      // 6. AUDIT & TRUSTEE CERTIFICATION
      // =========================================================================
      const certH = 58;
      if (curY + certH > pageHeight - margin - 25) {
        doc.addPage();
        drawWatermark();
        drawPageFrame();
        curY = margin + 10;
      }

      doc.rect(margin, curY, contentWidth, certH).fillColor('#f8fafc').fill();
      doc.rect(margin, curY, contentWidth, certH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // Left: Certification text
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#003366')
        .text('AUDIT & TRUSTEE CERTIFICATION', margin + 12, curY + 6);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569')
        .text(
          `Certified that the above consolidated statement of all accounts and receipt vouchers reflects a true, complete, and reconciled record of all contributions received by ${trustName}. All collections are audited and accounted for charitable trust welfare activities.`,
          margin + 12,
          curY + 18,
          { width: 330, lineGap: 1.5 }
        );

      // Right: Signatory block with real signature image
      const sigX = pageWidth - margin - 170;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#003366')
        .text(`For ${trustName}`, sigX, curY + 6, { align: 'center', width: 160 });

      if (fs.existsSync(SIGN_PATH)) {
        doc.image(SIGN_PATH, sigX + 55, curY + 17, { width: 50, height: 20 });
      }

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a')
        .text(settings.signatory_name || 'Authorized Signatory', sigX, curY + 38, { align: 'center', width: 160 });
      doc.font('Helvetica').fontSize(6.5).fillColor('#64748b')
        .text(settings.signatory_title || 'Trust Committee', sigX, curY + 47, { align: 'center', width: 160 });

      // =========================================================================
      // 7. SAFE PAGE NUMBERING (ZERO GHOST PAGES)
      // =========================================================================
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
          .text(
            `Page ${i + 1} of ${range.count}   •   ${trustName} — Consolidated Accounts & Receipts Audit Statement`,
            margin,
            pageHeight - margin + 6,
            { align: 'center', width: contentWidth, lineBreak: false }
          );
        doc.page.margins.bottom = oldBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an official single Expense / Payment Voucher PDF
 */
function generateExpenseVoucherPdf(expense, settings = {}) {
  return new Promise((resolve, reject) => {
    try {
      const trustName = settings.trust_name || 'Anbin Unavu';
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        info: {
          Title: `Expense_Voucher_${expense.expense_number}`,
          Author: trustName,
          Subject: `${trustName} Payment / Expense Voucher`,
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2;

      // 1. Outer Dark Navy Border (Matches Official Receipt Standard)
      doc.rect(margin, margin, contentWidth, pageHeight - margin * 2)
        .lineWidth(2.5)
        .strokeColor('#003366')
        .stroke();

      // 1b. Background Watermark Image
      if (fs.existsSync(HANDS_HEART_PATH)) {
        const watermarkWidth = 480;
        const watermarkHeight = 340;
        const watermarkX = (pageWidth - watermarkWidth) / 2;
        const watermarkY = 330;
        doc.save();
        doc.opacity(0.10);
        doc.image(HANDS_HEART_PATH, watermarkX, watermarkY, { width: watermarkWidth, height: watermarkHeight });
        doc.restore();
      }

      let y = margin + 12;

      // 2. Header: Logos & Organization Details
      const logoWidth = 110;
      const logoHeight = 100;
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, margin + 12, y, { width: logoWidth, height: logoHeight });
      }
      if (fs.existsSync(MOTHER_PATH)) {
        const motherW = 110;
        const motherH = 100;
        doc.save();
        doc.image(MOTHER_PATH, 450, margin + 12, { width: motherW, height: motherH });
        doc.restore();
      }

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
        doc.image(HANDS_HEART_PATH, startX - 14, y - 1, { width: 60, height: emblemSize });
        doc.fillColor('#003366').text(titleText, startX + emblemSize + emblemGap, y, { lineBreak: false });
        doc.image(HANDS_HEART_PATH, startX + 4 + emblemSize + emblemGap + titleWidth + emblemGap, y - 4, { width: 60, height: emblemSize });
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
          .text('அன்பின் உணவு', xcord, ycord);
      }
      y += 25;

      // Dynamic Tagline / Mission lines (Cleanly split to prevent logo collision)
      if (settings.tagline) {
        const taglines = settings.tagline.split(/\n|\|/).map(t => t.trim().replace(/^“|”|"$|^"/g, '')).filter(Boolean);
        taglines.forEach((tag, idx) => {
          doc.font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(idx % 2 === 0 ? '#1e293b' : '#b91c1c')
            .text(`“${tag}”`, headerTextX, y, { align: 'center', width: headerTextWidth });
          y += 14;
        });
      }

      // Address split across two lines to avoid overlapping circular cameos
      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor('#334155')
        .text('Subramanya Nagar, Kambar Street, Bye-Pass Road', headerTextX, y, { align: 'center', width: headerTextWidth });
      y += 14;

      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor('#334155')
        .text('Tiruttani – 631209, Tiruvallur District, Tamilnadu.', headerTextX, y, { align: 'center', width: headerTextWidth });
      y += 14;

      // Contact & Registration Info (Only show non-empty fields)
      const metaParts = [];
      if (settings.reg_number && settings.reg_number.trim()) metaParts.push(`Reg No: ${settings.reg_number.trim()}`);
      if (settings.pan_number && settings.pan_number.trim()) metaParts.push(`PAN: ${settings.pan_number.trim()}`);
      if (settings.contact_phone && settings.contact_phone.trim()) metaParts.push(`Ph: ${settings.contact_phone.trim()}`);
      if (metaParts.length > 0) {
        doc.font('Helvetica')
          .fontSize(8)
          .fillColor('#64748b')
          .text(metaParts.join('  •  '), headerTextX, y, { align: 'center', width: headerTextWidth });
        y += 14;
      }

      y += 6;

      // 3. Payment & Expense Voucher Banner
      const bannerHeight = 28;
      doc.rect(margin + 16, y, contentWidth - 32, bannerHeight)
        .fillColor('#f1f5f9')
        .fill();
      doc.rect(margin + 16, y, contentWidth - 32, bannerHeight)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#003366')
        .text('PAYMENT & EXPENSE VOUCHER', margin + 16, y + 7, { align: 'center', width: contentWidth - 32, characterSpacing: 1 });

      y += bannerHeight + 14;

      // 4. Metadata Box
      const tableX = margin + 16;
      const tableWidth = contentWidth - 32;
      const colWidth = tableWidth / 3;

      doc.rect(tableX, y, tableWidth, 22).fillColor('#f8fafc').fill();
      doc.rect(tableX, y, tableWidth, 22).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#003366');
      doc.text('Voucher No.', tableX + 12, y + 7);
      doc.text('Voucher Date', tableX + colWidth, y + 7, { align: 'center', width: colWidth });
      doc.text('Payment Status', tableX + colWidth * 2, y + 7, { align: 'center', width: colWidth });
      y += 22;

      let formattedDate = '';
      if (expense.expense_date) {
        try {
          const d = new Date(expense.expense_date);
          formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
          formattedDate = String(expense.expense_date);
        }
      }

      doc.rect(tableX, y, tableWidth, 24).fillColor('#ffffff').fill();
      doc.rect(tableX, y, tableWidth, 24).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a');
      doc.text(expense.expense_number || '', tableX + 12, y + 7);
      doc.text(formattedDate || '', tableX + colWidth, y + 7, { align: 'center', width: colWidth });
      doc.fillColor('#059669').text('APPROVED & DISBURSED', tableX + colWidth * 2, y + 7, { align: 'center', width: colWidth });
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
          .text(value || '', tableX + 160, curY + 7, { width: tableWidth - 170 });

        return curY + rowHeight;
      };

      // 5. Section: PAYEE & CATEGORY DETAILS
      y = drawBanner('PAYEE & CATEGORY DETAILS', y);
      y = drawRow('Paid To (Payee / Vendor)', expense.payee_name || '', y, 26);
      y = drawRow('Expense Category', expense.category || '', y, 26);
      y = drawRow('Fund / Account Head', expense.head_name || 'General Trust Expense', y, 26);

      y += 10;

      // 6. Section: PAYMENT & DISBURSEMENT DETAILS
      y = drawBanner('PAYMENT & DISBURSEMENT DETAILS', y);

      const amtVal = (expense.amount && !isNaN(parseFloat(expense.amount)))
        ? `Rs. ${parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : '';
      y = drawRow('Amount (INR)', amtVal, y, 26);
      y = drawRow('Amount in Words', expense.amount_words || '', y, 28);
      y = drawRow('Payment Mode', expense.payment_mode || 'Cash', y, 26);

      const refParts = [];
      if (expense.reference_no) refParts.push(`Txn/UTR: ${expense.reference_no}`);
      if (expense.bill_number) refParts.push(`Bill/Invoice: ${expense.bill_number}`);
      y = drawRow('Reference / Bill No', refParts.join('  •  ') || '—', y, 26);

      if (expense.notes) {
        y = drawRow('Purpose / Remarks', expense.notes, y, 32);
      }

      y += 24;

      // 7. Signature Block (Authorized Signatory only)
      const sigBlockW = 190;
      const sigBlockX = tableX + tableWidth - sigBlockW;

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#003366');
      doc.text('Authorized Signatory', sigBlockX, y, { width: sigBlockW, align: 'center' });

      if (fs.existsSync(SIGN_PATH)) {
        const signW = 70;
        const signH = 38;
        const signX = sigBlockX + (sigBlockW - signW) / 2;
        doc.image(SIGN_PATH, signX, y + 14, { width: signW, height: signH });
      }

      y += 56;

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
      doc.text(settings.signatory_name || 'Managing Trustee', sigBlockX, y, { width: sigBlockW, align: 'center' });

      y += 14;
      doc.font('Helvetica').fontSize(8).fillColor('#64748b');
      doc.text('Managing Trustee', sigBlockX, y, { width: sigBlockW, align: 'center' });

      y += 28;

      // Footer notice
      doc.rect(tableX, y, tableWidth, 20).fillColor('#f8fafc').fill();
      doc.rect(tableX, y, tableWidth, 20).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b')
        .text('This is an official audited disbursement voucher of Anbin Unavu Charitable Trust.', tableX, y + 6, { width: tableWidth, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an official consolidated Expenses Ledger Statement PDF (supports year & month filters)
 */
function generateExpensesLedgerPdf(expenses, settings = {}, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const trustName = settings.trust_name || 'Anbin Unavu';
      const currCode = 'Rs.';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 24,
        bufferPages: true,
        info: {
          Title: `${trustName.replace(/\s+/g, '_')}_Expenses_Statement_${new Date().toISOString().slice(0, 10)}`,
          Author: trustName,
          Subject: `${trustName} Consolidated Statement of Expenses & Outflows`,
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;

      const drawWatermark = () => {
        if (fs.existsSync(HANDS_HEART_PATH)) {
          doc.save();
          doc.opacity(0.06);
          const wmWidth = 420;
          const wmHeight = 300;
          doc.image(HANDS_HEART_PATH, (pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2, {
            width: wmWidth,
            height: wmHeight,
          });
          doc.restore();
        }
      };

      const drawPageFrame = () => {
        doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin * 2) + 8)
          .lineWidth(1)
          .strokeColor('#be123c')
          .stroke();
      };

      drawWatermark();
      drawPageFrame();

      // Header (Rich Rose / Maroon)
      const headerHeight = 78;
      doc.rect(margin, margin, contentWidth, headerHeight).fillColor('#881337').fill();

      if (fs.existsSync(LOGO_PATH)) {
        doc.circle(margin + 36, margin + 39, 26).fillColor('#ffffff').fill();
        doc.image(LOGO_PATH, margin + 13, margin + 16, { width: 46, height: 46 });
      }

      if (fs.existsSync(MOTHER_PATH)) {
        const motherCameoW = 44;
        const motherCameoH = 54;
        const motherCenterX = pageWidth - margin - 36;
        const motherCenterY = margin + 39;
        doc.save();
        doc.ellipse(motherCenterX, motherCenterY, motherCameoW / 2, motherCameoH / 2).clip();
        doc.image(MOTHER_PATH, motherCenterX - motherCameoW / 2, motherCenterY - motherCameoH / 2, {
          width: motherCameoW,
          height: motherCameoH,
        });
        doc.restore();
        doc.ellipse(motherCenterX, motherCenterY, motherCameoW / 2 + 1, motherCameoH / 2 + 1)
          .lineWidth(1.5)
          .strokeColor('#fde68a')
          .stroke();
      }

      const centerStartX = margin + 70;
      const centerWidth = contentWidth - 140;
      let curY = margin + 8;

      doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
        .text(trustName.toUpperCase(), centerStartX, curY, { align: 'center', width: centerWidth, characterSpacing: 1 });
      curY += 18;

      if (settings.address) {
        doc.font('Helvetica').fontSize(7.5).fillColor('#fecdd3')
          .text(settings.address.replace(/\n/g, ', '), centerStartX, curY, { align: 'center', width: centerWidth });
        curY += 12;
      }

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#fde68a')
        .text('CONSOLIDATED STATEMENT OF EXPENSES & OUTFLOWS', centerStartX, curY, { align: 'center', width: centerWidth, characterSpacing: 0.5 });

      curY = margin + headerHeight + 6;

      // Metadata Ribbon
      const metaHeight = 20;
      doc.rect(margin, curY, contentWidth, metaHeight).fillColor('#fff1f2').fill();
      doc.rect(margin, curY, contentWidth, metaHeight).lineWidth(0.5).strokeColor('#fecdd3').stroke();

      const genDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let periodLabel = 'All Recorded Expenses';
      if (filters.year && filters.month) {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        periodLabel = `${monthNames[parseInt(filters.month)] || filters.month} ${filters.year}`;
      } else if (filters.year) {
        periodLabel = `Year ${filters.year}`;
      }

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#9f1239');
      doc.text(`AUDITED DISBURSEMENT LEDGER`, margin + 10, curY + 6);
      doc.font('Helvetica').fillColor('#64748b');
      doc.text(`Period: ${periodLabel}   •   Generated: ${genDateStr}`, margin + 200, curY + 6, {
        align: 'right',
        width: contentWidth - 210,
      });

      curY += metaHeight + 10;

      // KPI Summary Cards
      const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalCount = expenses.length;

      const cardW = (contentWidth - 16) / 3;
      const cardH = 46;

      doc.rect(margin, curY, cardW, cardH).fillColor('#fff1f2').fill();
      doc.rect(margin, curY, cardW, cardH).lineWidth(0.5).strokeColor('#fecdd3').stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#9f1239').text('TOTAL OUTFLOWS (EXPENSES)', margin + 10, curY + 8);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#be123c')
        .text(`${currCode} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 10, curY + 22);

      doc.rect(margin + cardW + 8, curY, cardW, cardH).fillColor('#f8fafc').fill();
      doc.rect(margin + cardW + 8, curY, cardW, cardH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('TOTAL EXPENSE VOUCHERS', margin + cardW + 18, curY + 8);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a')
        .text(`${totalCount} Vouchers`, margin + cardW + 18, curY + 22);

      doc.rect(margin + (cardW + 8) * 2, curY, cardW, cardH).fillColor('#f8fafc').fill();
      doc.rect(margin + (cardW + 8) * 2, curY, cardW, cardH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('DISBURSEMENT AUDIT', margin + (cardW + 8) * 2 + 10, curY + 8);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#059669')
        .text('Verified & Audited', margin + (cardW + 8) * 2 + 10, curY + 23);

      curY += cardH + 12;

      // Table Header Setup
      const cols = [
        { label: '#', width: 22, align: 'center' },
        { label: 'Voucher No', width: 95, align: 'left' },
        { label: 'Date', width: 55, align: 'center' },
        { label: 'Paid To (Payee)', width: 135, align: 'left' },
        { label: 'Category', width: 95, align: 'left' },
        { label: 'Mode & Ref', width: 75, align: 'left' },
        { label: 'Amount (Rs.)', width: 70, align: 'right' },
      ];

      const drawTableHeader = (yPos) => {
        doc.rect(margin, yPos, contentWidth, 20).fillColor('#881337').fill();
        let curX = margin;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        cols.forEach((c) => {
          doc.text(c.label, curX + 4, yPos + 6, { width: c.width - 8, align: c.align });
          curX += c.width;
        });
        return yPos + 20;
      };

      curY = drawTableHeader(curY);

      const rowHeight = 22;
      const maxY = pageHeight - margin - 50;

      expenses.forEach((exp, idx) => {
        if (curY + rowHeight > maxY) {
          doc.addPage();
          drawWatermark();
          drawPageFrame();
          curY = margin + 14;
          curY = drawTableHeader(curY);
        }

        const isAlt = idx % 2 === 1;
        doc.rect(margin, curY, contentWidth, rowHeight).fillColor(isAlt ? '#fff1f2' : '#ffffff').fill();
        doc.rect(margin, curY, contentWidth, rowHeight).lineWidth(0.4).strokeColor('#fecdd3').stroke();

        let curX = margin;

        // Sl
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
        doc.text(String(idx + 1), curX, curY + 6, { width: cols[0].width, align: 'center' });
        curX += cols[0].width;

        // Voucher #
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#be123c');
        doc.text(exp.expense_number || '', curX + 4, curY + 6, { width: cols[1].width - 8, align: 'left' });
        curX += cols[1].width;

        // Date
        let dateStr = '';
        if (exp.expense_date) {
          try {
            dateStr = new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
          } catch (e) {
            dateStr = String(exp.expense_date);
          }
        }
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
        doc.text(dateStr, curX, curY + 6, { width: cols[2].width, align: 'center' });
        curX += cols[2].width;

        // Payee
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
        doc.text(exp.payee_name || '', curX + 4, curY + 6, { width: cols[3].width - 8, align: 'left', lineBreak: false });
        curX += cols[3].width;

        // Category
        doc.font('Helvetica').fontSize(7).fillColor('#475569');
        doc.text(exp.category || '', curX + 4, curY + 6, { width: cols[4].width - 8, align: 'left', lineBreak: false });
        curX += cols[4].width;

        // Mode
        doc.font('Helvetica').fontSize(7).fillColor('#475569');
        const modeStr = exp.reference_no ? `${exp.payment_mode} (${exp.reference_no})` : (exp.payment_mode || 'Cash');
        doc.text(modeStr, curX + 4, curY + 6, { width: cols[5].width - 8, align: 'left', lineBreak: false });
        curX += cols[5].width;

        // Amount
        const rowAmt = parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#be123c');
        doc.text(rowAmt, curX, curY + 6, { width: cols[6].width - 6, align: 'right' });

        curY += rowHeight;
      });

      // Total Row
      if (curY + 24 > maxY) {
        doc.addPage();
        drawWatermark();
        drawPageFrame();
        curY = margin + 14;
      }

      doc.rect(margin, curY, contentWidth, 22).fillColor('#ffe4e6').fill();
      doc.rect(margin, curY, contentWidth, 22).lineWidth(0.8).strokeColor('#be123c').stroke();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#9f1239');
      doc.text(`TOTAL EXPENDITURE (${totalCount} VOUCHERS)`, margin + 12, curY + 6);
      doc.text(
        `${currCode} ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        margin,
        curY + 6,
        { width: contentWidth - 10, align: 'right' }
      );

      curY += 36;

      // Certification Signature Block
      if (curY + 50 > pageHeight - margin - 20) {
        doc.addPage();
        drawWatermark();
        drawPageFrame();
        curY = margin + 20;
      }

      const sigX = pageWidth - margin - 180;
      if (fs.existsSync(SIGN_PATH)) {
        doc.image(SIGN_PATH, sigX + 40, curY - 24, { width: 75, height: 32 });
      }
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a')
        .text('For ' + trustName.toUpperCase(), sigX, curY + 12, { width: 170, align: 'center' });
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b')
        .text(settings.signatory_title || 'Managing Trustee / Authorized Signatory', sigX, curY + 24, { width: 170, align: 'center' });

      // Page numbers footer
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
          .text(
            `Page ${i + 1} of ${range.count}   •   ${trustName} — Consolidated Expenses & Outflows Statement`,
            margin,
            pageHeight - margin + 6,
            { align: 'center', width: contentWidth, lineBreak: false }
          );
        doc.page.margins.bottom = oldBottom;
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
  generateExpenseVoucherPdf,
  generateExpensesLedgerPdf,
};

// If executed directly from command line (e.g. node services/pdfService.js)
if (require.main === module) {
  const sampleBlankReceipt = {
    receipt_number: '',
    receipt_date: '',
    receipt_time: '',
    donor_name: '',
    donor_phone: '',
    donor_email: '',
    donor_address: '',
    amount: '',
    amount_words: '',
    payment_mode: '',
    cheque_or_tx_ref: '',
    bank_name: '',
  };

  const sampleSettings = {
    trust_name: 'Anbin Unavu',
    tagline: 'Dedicated to Social Upliftment, Education & Healthcare',
    currency_symbol: '₹',
    currency_code: 'INR',
    address: 'Subramanya Nagar, Bye-Pass Road, Tiruttani – 631209, Tiruvallur District, Tamilnadu.',
    signatory_name: 'Authorized Signatory',
    signatory_title: 'Managing Trustee',
  };

  console.log('Generating sample bill without details...');
  generateReceiptPdf(sampleBlankReceipt, sampleSettings)
    .then((pdfBuffer) => {
      const rootPath = path.join(__dirname, '../../sample_bill_without_details.pdf');
      const localPath = path.join(__dirname, 'sample_bill_without_details.pdf');
      fs.writeFileSync(rootPath, pdfBuffer);
      fs.writeFileSync(localPath, pdfBuffer);
      console.log('\n================================================================');
      console.log('✓ Sample Bill Without Details generated successfully!');
      console.log(`  File 1 (Root):   ${rootPath}`);
      console.log(`  File 2 (Local):  ${localPath}`);
      console.log(`  File size:       ${pdfBuffer.length} bytes`);
      console.log('================================================================\n');
    })
    .catch((err) => {
      console.error('Error generating sample bill:', err);
    });
}
