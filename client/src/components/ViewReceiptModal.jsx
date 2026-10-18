import React from 'react';
import { X, Printer, FileDown, MessageCircle, Target, Users } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function ViewReceiptModal({ receipt, settings, isOpen, onClose, onShareWhatsApp }) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.receipt_date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = receipt.receipt_time || '10:30 AM';
  const formattedAmount = `${parseFloat(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <div className="modal-title">Receipt: {receipt.receipt_number}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              <span className="btn-text-desktop">Print</span>
            </button>
            <button
              className="btn btn-whatsapp btn-sm"
              onClick={() => onShareWhatsApp(receipt)}
            >
              <MessageCircle size={14} />
              <span className="btn-text-desktop">WhatsApp</span>
            </button>
            <a
              href={`${API_BASE}/receipts/${receipt.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
            >
              <FileDown size={14} />
              <span className="btn-text-desktop">Download PDF</span>
              <span className="btn-text-mobile">PDF</span>
            </a>
            <button className="btn btn-outline btn-icon" onClick={onClose} aria-label="Close modal">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: '#e2e8f0', display: 'flex', justifyContent: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Exactly matching Bridge of Love Paper Receipt format */}
          <div
            className="receipt-paper-preview"
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '2.5px solid #003366',
              padding: '28px 24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              fontFamily: 'Helvetica, Arial, sans-serif',
              color: '#0f172a',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Watermark Image with ~50% Opacity */}
            <div className="receipt-watermark-bg">
              <img src="/hands_heart.png" alt="Bridge of Love Watermark" />
            </div>

            {/* Header: Logos & Organization Details */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <img
                src="/logo.png"
                alt="Bridge of Love Logo"
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                <div className="receipt-title-row">
                  <img
                    src="/hands_heart.png"
                    alt="Heart Emblem"
                    className="receipt-title-emblem"
                  />
                  <h1 style={{ fontSize: '35px', fontWeight: 'bold', color: '#db3604ff', margin: 0, letterSpacing: '0.5px' }}>
                    {settings?.trust_name || 'BRIDGE OF LOVE'}
                  </h1>
                  <img
                    src="/hands_heart.png"
                    alt="Heart Emblem"
                    className="receipt-title-emblem"
                  />
                </div>
                {settings?.tagline && settings.tagline.split(/\n|\|/).map((tag, idx) => (
                  <div key={idx} style={{ fontSize: '11px', fontWeight: 'bold', color: idx % 2 === 0 ? '#1e293b' : '#b91c1c' }}>
                    {tag.trim().startsWith('“') || tag.trim().startsWith('"') ? tag.trim() : `“${tag.trim()}”`}
                  </div>
                ))}
                <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', lineHeight: 1.4 }}>
                  Subramanya Nagar, Kambar Street, Bye-Pass Road<br />
                  Tiruttani – 631209, Tiruvallur District, Tamilnadu.
                </div>
              </div>
              <img
                src="/logo.png"
                alt="Bridge of Love Logo"
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Banner: PAYMENT RECEIPT */}
            <div style={{
              background: '#f1f5f9',
              color: '#003366',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '15px',
              padding: '8px',
              letterSpacing: '1px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0',
            }}>
              PAYMENT RECEIPT
            </div>

            {/* 3-Column Metadata Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#003366', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'left', width: '33%' }}>Receipt No.</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: '33%' }}>Date</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: '33%' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#ffffff', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{receipt.receipt_number}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{formattedDate}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{formattedTime}</td>
                </tr>
              </tbody>
            </table>

            {/* DONOR DETAILS Section */}
            <div style={{
              background: '#003366',
              color: '#ffffff',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '6px',
              letterSpacing: '0.8px',
            }}>
              DONOR DETAILS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '30%' }}>Donor Name</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{receipt.donor_name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Phone / Email</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                    {[receipt.donor_phone, receipt.donor_email].filter(Boolean).join('  /  ') || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Address</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{receipt.donor_address || '—'}</td>
                </tr>
              </tbody>
            </table>

            {/* DONATION DETAILS Section */}
            <div style={{
              background: '#003366',
              color: '#ffffff',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '6px',
              letterSpacing: '0.8px',
            }}>
              DONATION DETAILS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '30%' }}>Amount (INR)</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '13px' }}>{formattedAmount}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Amount in words</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontStyle: 'italic' }}>{receipt.amount_words}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Payment mode</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{receipt.payment_mode}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Transaction / ref.</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                    {[receipt.cheque_or_tx_ref, receipt.bank_name].filter(Boolean).join(' - ') || '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Received by & Signature on the Right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', padding: '0 8px' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11.5px', color: '#0f172a', marginBottom: '4px' }}>
                  Received by
                </div>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src="/sign.png"
                    alt="Signature"
                    style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ borderBottom: '1px solid #475569', width: '100%', margin: '4px 0 6px 0' }}></div>
                {settings?.signatory_name && (
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{settings.signatory_name}</div>
                )}
              </div>
            </div>

            {/* OUR VISION & OUR MISSION Section (Borderless, Dividerless, Centered text matching PDF) */}
            <div style={{
              display: 'flex',
              margin: '18px 0 22px 0',
              gap: '28px',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Vision Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#881337', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  OUR VISION
                </div>
                <div style={{ fontSize: '10px', color: '#1e293b', lineHeight: 1.4, fontStyle: 'italic', marginBottom: '6px' }}>
                  “To build an inclusive and empathetic society where no individual is left behind in suffering, bridging the gap between privilege and poverty through unconditional love, mutual respect, and selfless service.”
                </div>
                <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.35 }}>
                  “அன்பும் இரக்கமும் நிறைந்த ஒரு சமூகத்தை உருவாக்குதல்; நலிந்த மற்றும் வறிய மக்களின் துயர் துடைத்து வாழ்வொளி ஏற்றுதல்.”
                </div>
              </div>

              {/* Mission Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#881337', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  OUR MISSION
                </div>
                <div style={{ fontSize: '10px', color: '#1e293b', lineHeight: 1.4, fontStyle: 'italic', marginBottom: '6px' }}>
                  “To connect compassionate hearts with people in need—extending immediate relief, educational aid, and essential sustenance to underserved communities with total transparency, dignity, and collective action.”
                </div>
                <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.35 }}>
                  “தேவைப்படுவோருக்கு கல்வி, உதவி மற்றும் ஆதரவை வழங்கி, மனிதநேயமிக்க கரங்களை ஒன்றிணைத்து சமுதாயத்தை மேம்படுத்துதல்.”
                </div>
              </div>
            </div>

            {/* Thank you note */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d', marginBottom: '4px' }}>
                Thank you for your generous contribution.
              </div>
              <div style={{ fontSize: '12px', color: '#003366', fontWeight: 500 }}>
                {settings?.signatory_title || `Issued by ${settings?.trust_name || 'Bridge of Love'} (Team Members)`}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
