import React, { useState } from 'react';
import { X, Send, Eye, FileText, Check, ShieldCheck, Mail } from 'lucide-react';
import { numberToWordsINR } from '../utils/numberToWords';

export default function NewReceiptModal({
  isOpen,
  onClose,
  onSubmit,
  heads,
  donors,
  settings,
}) {
  const [donorMode, setDonorMode] = useState('existing'); // 'existing' | 'new'
  const [selectedDonorId, setSelectedDonorId] = useState('');

  const [formData, setFormData] = useState({
    donor_name: '',
    donor_pan: '',
    donor_phone: '',
    donor_whatsapp: '',
    donor_email: '',
    donor_address: '',
    head_id: heads[0]?.id || null,
    head_name: 'Monthly Member Contribution',
    amount: '',
    payment_mode: 'UPI',
    cheque_or_tx_ref: '',
    bank_name: '',
    receipt_date: new Date().toISOString().slice(0, 10),
    notes: '',
    auto_send_email: true,
  });

  const [previewTab, setPreviewTab] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDonorSelect = (e) => {
    const dId = e.target.value;
    setSelectedDonorId(dId);
    if (!dId) return;

    const found = donors.find((d) => d.id === parseInt(dId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        donor_name: found.full_name || '',
        donor_pan: found.pan_or_id || '',
        donor_phone: found.phone || '',
        donor_whatsapp: found.whatsapp || found.phone || '',
        donor_email: found.email || '',
        donor_address: found.address || '',
      }));
    }
  };

  const handleHeadSelect = (e) => {
    const hId = e.target.value;
    const found = heads.find((h) => h.id === parseInt(hId));
    setFormData((prev) => ({
      ...prev,
      head_id: hId,
      head_name: found?.name || '',
    }));
  };

  const amountWords = formData.amount ? numberToWordsINR(formData.amount) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.donor_name.trim()) {
      alert('Please enter or select a Donor Name');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const clientISTTime = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      await onSubmit({
        ...formData,
        receipt_time: clientISTTime,
        donor_id: donorMode === 'existing' && selectedDonorId ? parseInt(selectedDonorId) : null,
      });
      onClose();
    } catch (err) {
      alert('Failed to generate receipt: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content wide">
        <div className="modal-header">
          <div>
            <div className="modal-title">Generate Bridge of Love Payment Receipt</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Official numbered bill • Automatic SMTP email delivery & WhatsApp sharing
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn-sm ${previewTab ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPreviewTab(!previewTab)}
            >
              <Eye size={14} />
              <span>{previewTab ? 'Edit Form' : 'Live Preview'}</span>
            </button>
            <button className="btn btn-outline btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {!previewTab ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Donor Selection Mode */}
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>Donor / Benefactor Profile:</span>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="donorMode"
                          checked={donorMode === 'existing'}
                          onChange={() => setDonorMode('existing')}
                        />
                        <span>Select Existing Donor</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="donorMode"
                          checked={donorMode === 'new'}
                          onChange={() => {
                            setDonorMode('new');
                            setSelectedDonorId('');
                          }}
                        />
                        <span>Add New Donor</span>
                      </label>
                    </div>
                  </div>

                  {donorMode === 'existing' && (
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <select
                        className="form-control"
                        value={selectedDonorId}
                        onChange={handleDonorSelect}
                      >
                        <option value="">-- Choose registered donor or pick from list --</option>
                        {donors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name} {d.phone ? `— ${d.phone}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span>Donor Name</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Smt. Rajeshwari Sharma"
                        required
                        value={formData.donor_name}
                        onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>PAN Card (optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        style={{ textTransform: 'uppercase' }}
                        value={formData.donor_pan}
                        onChange={(e) => setFormData({ ...formData, donor_pan: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>WhatsApp / Phone Number</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 919876543210"
                        value={formData.donor_whatsapp}
                        onChange={(e) => setFormData({ ...formData, donor_whatsapp: e.target.value, donor_phone: e.target.value })}
                      />
                      <span className="form-help">For manual WhatsApp bill sharing</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. donor@example.com"
                        value={formData.donor_email}
                        onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                      />
                      <span className="form-help">PDF will be automatically sent via SMTP</span>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Residential or business address"
                        value={formData.donor_address}
                        onChange={(e) => setFormData({ ...formData, donor_address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Contribution Particulars Grid */}
                <div className="form-grid">

                  <div className="form-group">
                    <label className="form-label">
                      <span>Receipt Date</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={formData.receipt_date}
                      onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                    />
                  </div>

                  {/* Amount with Words Auto-Generation */}
                  <div className="form-group full-width">
                    <label className="form-label">
                      <span>Amount (INR)</span>
                      <span className="required">*</span>
                    </label>
                    <div className="amount-input-wrap">
                      <span className="amount-currency-symbol">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="form-control"
                        placeholder="0.00"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    {amountWords && (
                      <div className="amount-words-box" style={{ marginTop: '8px' }}>
                        <strong>In Words:</strong> {amountWords}
                      </div>
                    )}
                  </div>

                  {/* Payment Mode */}
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      className="form-control"
                      value={formData.payment_mode}
                      onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transaction / Ref.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. UPI/261016/542198"
                      value={formData.cheque_or_tx_ref}
                      onChange={(e) => setFormData({ ...formData, cheque_or_tx_ref: e.target.value })}
                    />
                  </div>
                </div>

                {/* Free SMTP Automatic Email Toggle */}
                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.auto_send_email}
                    onChange={(e) => setFormData({ ...formData, auto_send_email: e.target.checked })}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#059669" />
                      <span>Automatically send PDF bill to donor's email using SMTP (Free)</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      Renders the Bridge of Love vector PDF and dispatches it immediately via configured SMTP.
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              /* Live Bridge of Love Receipt Preview */
              <div style={{ display: 'flex', justifyContent: 'center', background: '#e2e8f0', padding: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div
                  className="receipt-paper-preview"
                  style={{
                    maxWidth: '580px',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '2.5px solid #003366',
                    padding: '24px 20px',
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                      <div className="receipt-title-row">
                        <img src="/hands_heart.png" alt="Emblem" className="receipt-title-emblem" />
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#003366' }}>{settings?.trust_name || 'BRIDGE OF LOVE'}</div>
                        <img src="/hands_heart.png" alt="Emblem" className="receipt-title-emblem" />
                      </div>
                      {settings?.tagline && settings.tagline.split(/\n|\|/).map((tag, idx) => (
                        <div key={idx} style={{ fontSize: '10.5px', fontWeight: 'bold', color: idx % 2 === 0 ? '#1e293b' : '#b91c1c' }}>
                          {tag.trim().startsWith('“') || tag.trim().startsWith('"') ? tag.trim() : `“${tag.trim()}”`}
                        </div>
                      ))}
                      {settings?.address && (
                        <div style={{ fontSize: '9.5px', color: '#334155', marginTop: '2px', lineHeight: 1.3 }}>
                          {settings.address}
                        </div>
                      )}
                      {(settings?.reg_number || settings?.pan_number || settings?.contact_phone || settings?.email) && (
                        <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '3px' }}>
                          {[
                            settings?.reg_number ? `Reg: ${settings.reg_number}` : '',
                            settings?.pan_number ? `PAN: ${settings.pan_number}` : '',
                            settings?.contact_phone ? `Phone: ${settings.contact_phone}` : '',
                            settings?.email ? `Email: ${settings.email}` : ''
                          ].filter(Boolean).join('  •  ')}
                        </div>
                      )}
                    </div>
                    <img src="/logo.png" alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                  </div>

                  <div style={{ background: '#f1f5f9', color: '#003366', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', padding: '6px', marginBottom: '14px' }}>
                    PAYMENT RECEIPT
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#003366', fontWeight: 'bold' }}>
                        <th style={{ padding: '6px 10px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Receipt No.</th>
                        <th style={{ padding: '6px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Date</th>
                        <th style={{ padding: '6px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>[Auto Assigned]</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{new Date(formData.receipt_date).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ background: '#003366', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', padding: '5px' }}>
                    DONOR DETAILS
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11.5px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '30%' }}>Donor Name</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{formData.donor_name || 'Donor Name'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Phone / Email</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>
                          {[formData.donor_phone, formData.donor_email].filter(Boolean).join('  /  ') || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Address</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{formData.donor_address || '—'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ background: '#003366', color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', padding: '5px' }}>
                    DONATION DETAILS
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11.5px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '30%' }}>Amount (INR)</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                          {parseFloat(formData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Amount in words</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontStyle: 'italic' }}>{amountWords || 'Rupees Zero Only'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Payment mode</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{formData.payment_mode}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Transaction / ref.</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{formData.cheque_or_tx_ref || '—'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', padding: '0 6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Received by</div>
                    <div style={{ width: '180px', borderBottom: '1px solid #475569', height: '20px' }}></div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#15803d' }}>
                      Thank you for your generous contribution.
                    </div>
                    <div style={{ fontSize: '11px', color: '#003366' }}>
                      {settings?.signatory_title || `Issued by ${settings?.trust_name || 'Bridge of Love'} (Team Members)`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-emerald" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Generating & Sending...' : 'Generate Receipt & Send'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
