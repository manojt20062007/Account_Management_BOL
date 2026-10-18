import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, ShieldCheck, Mail, CheckCircle2, AlertTriangle, Key, 
  Server, Save, Eye, EyeOff, RotateCcw, Upload, FileText, Check, 
  Sparkles, Send, MapPin, Phone, Building2, RefreshCw
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function SettingsView({ settings, onSaveSettings, onVerifySmtp, onLiveChange }) {
  const [formData, setFormData] = useState({ ...settings });
  const [initialData, setInitialData] = useState({ ...settings });
  const [isDirty, setIsDirty] = useState(false);
  
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null); // { success: boolean, message: string }
  
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null); // { success: boolean, message: string }
  
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState(null);
  
  const fileInputRef = useRef(null);

  // Synchronize state dynamically whenever settings prop updates from backend
  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
      setInitialData({ ...settings });
      setIsDirty(false);
      if (settings.email && !testEmailAddress) {
        setTestEmailAddress(settings.email);
      }
    }
  }, [settings]);

  // Dynamic field update handler with live preview streaming
  const handleChange = (field, val) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(initialData));
      if (onLiveChange) onLiveChange(next);
      return next;
    });
    setSaveSuccess(false);
  };

  // Revert all unsaved edits dynamically
  const handleDiscard = () => {
    setFormData({ ...initialData });
    setIsDirty(false);
    if (onLiveChange) onLiveChange(null);
    setLogoPreview(null);
  };

  // Preset configuration applicator
  const applySmtpPreset = (preset) => {
    if (preset === 'gmail-tls') {
      handleChange('smtp_host', 'smtp.gmail.com');
      handleChange('smtp_port', 587);
      handleChange('smtp_secure', false);
    } else if (preset === 'gmail-ssl') {
      handleChange('smtp_host', 'smtp.gmail.com');
      handleChange('smtp_port', 465);
      handleChange('smtp_secure', true);
    } else if (preset === 'outlook') {
      handleChange('smtp_host', 'smtp.office365.com');
      handleChange('smtp_port', 587);
      handleChange('smtp_secure', false);
    } else if (preset === 'brevo') {
      handleChange('smtp_host', 'smtp-relay.brevo.com');
      handleChange('smtp_port', 2525);
      handleChange('smtp_secure', false);
      if (!formData.smtp_from_email || formData.smtp_from_email.includes('@smtp-brevo.com')) {
        if (formData.email && !formData.email.includes('@smtp-brevo.com')) {
          handleChange('smtp_from_email', formData.email);
        }
      }
    }
  };

  // Quick Signatory Title selector
  const applySignatoryTitle = (title) => {
    handleChange('signatory_title', title);
  };

  // Dynamic Save handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      setInitialData({ ...formData });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Dynamic SMTP Connection test
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const res = await onVerifySmtp({
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_user: formData.smtp_user,
        smtp_pass: formData.smtp_pass,
      });
      setSmtpStatus({ success: true, message: res.message || 'SMTP connected and verified successfully!' });
    } catch (err) {
      setSmtpStatus({ success: false, message: err.message || 'SMTP connection failed. Check host, port, or app password.' });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Dynamic Live Test Email dispatcher
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      alert('Please enter a recipient email address for the test receipt.');
      return;
    }
    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch(`${API_BASE}/settings/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: testEmailAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus({ success: true, message: data.message });
      } else {
        setTestEmailStatus({ success: false, message: data.error || 'Failed to dispatch test email' });
      }
    } catch (err) {
      setTestEmailStatus({ success: false, message: err.message });
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Dynamic Logo File Selector & Uploader
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result;
      setLogoPreview(base64String);
      setUploadingLogo(true);
      setLogoStatus(null);

      try {
        const res = await fetch(`${API_BASE}/settings/upload-logo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String }),
        });
        const data = await res.json();
        if (data.success) {
          setLogoTimestamp(Date.now());
          setLogoStatus({ success: true, message: 'Official logo updated successfully!' });
        } else {
          setLogoStatus({ success: false, message: data.error || 'Failed to update logo' });
        }
      } catch (err) {
        setLogoStatus({ success: false, message: err.message });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Extract tagline items dynamically
  const parsedTaglines = (formData.tagline || '')
    .split(/\n|\|/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Extract detected city/region dynamically
  const detectedLocation = formData.address
    ? formData.address.split(',').map((p) => p.trim()).filter(Boolean).slice(-2).join(', ')
    : 'Tiruttani, Tamilnadu';

  // Dynamic profile completion meter
  const profileFields = [
    formData.trust_name,
    formData.tagline,
    formData.reg_number,
    formData.pan_number,
    formData.address,
    formData.contact_phone,
    formData.email,
    formData.signatory_name,
    formData.signatory_title,
    formData.receipt_prefix,
  ];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / profileFields.length) * 100);

  return (
    <div className="view-body" style={{ paddingBottom: '80px' }}>
      {/* 1. Dynamic Top Status Banner & Live Metrics */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: isDirty ? '#fef3c7' : '#ecfdf5',
            color: isDirty ? '#d97706' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isDirty ? <RefreshCw size={22} className="spin-slow" /> : <ShieldCheck size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {formData.trust_name || 'Trust Accounting System'}
              </h3>
              {isDirty ? (
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '999px' }}>
                  ● Unsaved Edits (Previewing Live)
                </span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '999px' }}>
                  ✓ All Elements Synced
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Every field below dynamically updates Payment Receipts, PDFs, Member Statements, and Top Bar in real time.
            </p>
          </div>
        </div>

        {/* Profile Completeness Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Trust Profile Setup</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: completionPercentage === 100 ? '#059669' : '#0284c7' }}>
              {completionPercentage}% Complete ({filledCount}/{profileFields.length} fields)
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowLivePreview(!showLivePreview)}
            title="Toggle Live Receipt Header Preview"
          >
            <FileText size={14} />
            <span>{showLivePreview ? 'Hide Receipt Preview' : 'Show Live Preview'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
        {/* Save confirmation banner */}
        {saveSuccess && (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '14px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>Trust Configuration & SMTP settings saved successfully! All receipts and statements updated.</span>
          </div>
        )}

        {/* 2. Trust Regulatory & Profile Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={18} color="#003366" />
              <span>Trust Legal Identity & Official Receipt Header</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Appears dynamically across all generated {formData.trust_name || 'Trust'} receipts, bills & PDF accounts
            </span>
          </div>

          <div style={{ padding: '24px' }} className="form-grid">
            {/* Dynamic Logo Uploader & Emblem Box */}
            <div className="form-group full-width" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    <img
                      src={logoPreview || `/logo.png?t=${logoTimestamp}`}
                      alt="Trust Emblem"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = '/logo.png'; }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '2px' }}>Official Trust Logo / Emblem</label>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      Renders dynamically on both left and right headers of official Bridge of Love vector PDF receipts.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload size={14} />
                    <span>{uploadingLogo ? 'Uploading Emblem...' : 'Change Trust Logo'}</span>
                  </button>
                </div>
              </div>

              {logoStatus && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: logoStatus.success ? '#047857' : '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {logoStatus.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{logoStatus.message}</span>
                </div>
              )}
            </div>

            {/* Trust Full Legal Name */}
            <div className="form-group full-width">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Trust Full Legal Name *</label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {(formData.trust_name || '').length} characters
                </span>
              </div>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. BRIDGE OF LOVE"
                value={formData.trust_name || ''}
                onChange={(e) => handleChange('trust_name', e.target.value)}
              />
            </div>

            {/* Tagline / Mission Line */}
            <div className="form-group full-width">
              <label className="form-label">Trust Taglines / Slogans (Pipe | or Newline Separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder='“Humanity – Helping Hands” | “Connecting Compassionate Hearts with People in Need”'
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
              {/* Dynamic Slogan Pills */}
              {parsedTaglines.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {parsedTaglines.map((motto, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: idx % 2 === 0 ? '#f1f5f9' : '#fef2f2',
                        color: idx % 2 === 0 ? '#1e293b' : '#b91c1c',
                        border: idx % 2 === 0 ? '1px solid #cbd5e1' : '1px solid #fecaca'
                      }}
                    >
                      {motto.startsWith('“') || motto.startsWith('"') ? motto : `“${motto}”`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Registration Number */}
            <div className="form-group">
              <label className="form-label">Trust Registration Number *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. TR/BK-IV/452/2012"
                value={formData.reg_number || ''}
                onChange={(e) => handleChange('reg_number', e.target.value)}
              />
            </div>

            {/* Section 80G Approval */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Section 80G Approval / Order No.</label>
                <span style={{ fontSize: '10.5px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>Optional</span>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CIT(E)/BLR/80G/2021-22/AABTS1234F"
                value={formData.tax_exemption_80g || ''}
                onChange={(e) => handleChange('tax_exemption_80g', e.target.value)}
              />
            </div>

            {/* Section 12A Registration */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Section 12A Registration No.</label>
                <span style={{ fontSize: '10.5px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>Optional</span>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CIT(E)/12AA/2013-14/1042"
                value={formData.tax_exemption_12a || ''}
                onChange={(e) => handleChange('tax_exemption_12a', e.target.value)}
              />
            </div>

            {/* Trust PAN Number */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Trust PAN Number *</label>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: (formData.pan_number || '').length === 10 ? '#059669' : '#64748b'
                }}>
                  {(formData.pan_number || '').length === 10 ? '✓ 10 Chars' : `${(formData.pan_number || '').length}/10`}
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={10}
                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
                className="form-control"
                placeholder="e.g. AABTS1234F"
                value={formData.pan_number || ''}
                onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
              />
            </div>

            {/* Registered Office Address */}
            <div className="form-group full-width">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Registered Office Address</label>
                <span style={{ fontSize: '11px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  <span>Detected Location: {detectedLocation}</span>
                </span>
              </div>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Door No, Street, Landmark, City - Pincode, State."
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            {/* Contact Phone */}
            <div className="form-group">
              <label className="form-label">Contact Phone / Helpdesk</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 43210"
                value={formData.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
              />
            </div>

            {/* Official Email */}
            <div className="form-group">
              <label className="form-label">Official Trust Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="info@bridgeoflove.org"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            {/* Authorized Signatory Name */}
            <div className="form-group">
              <label className="form-label">Authorized Signatory Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Sri M. R. Sharma"
                value={formData.signatory_name || ''}
                onChange={(e) => handleChange('signatory_name', e.target.value)}
              />
            </div>

            {/* Signatory Title */}
            <div className="form-group">
              <label className="form-label">Signatory Title / Designation</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Managing Trustee"
                value={formData.signatory_title || ''}
                onChange={(e) => handleChange('signatory_title', e.target.value)}
              />
              {/* Quick suggestions pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {['Managing Trustee', 'Treasurer', 'President', 'Authorized Signatory'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => applySignatoryTitle(t)}
                    style={{
                      fontSize: '11px',
                      background: formData.signatory_title === t ? '#dbeafe' : '#f1f5f9',
                      color: formData.signatory_title === t ? '#1e40af' : '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt Voucher Prefix */}
            <div className="form-group">
              <label className="form-label">Receipt Voucher Prefix</label>
              <input
                type="text"
                className="form-control"
                placeholder="TR/REC"
                value={formData.receipt_prefix || ''}
                onChange={(e) => handleChange('receipt_prefix', e.target.value.toUpperCase())}
              />
              <span className="form-help">Sample output: {formData.receipt_prefix || 'TR/REC'}-1001</span>
            </div>

            {/* Currency Symbol & Code */}
            <div className="form-group">
              <label className="form-label">Currency Symbol & Code</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  style={{ width: '80px', textAlign: 'center', fontWeight: 'bold' }}
                  className="form-control"
                  placeholder="₹"
                  value={formData.currency_symbol || '₹'}
                  onChange={(e) => handleChange('currency_symbol', e.target.value)}
                />
                <input
                  type="text"
                  style={{ flex: 1, textTransform: 'uppercase' }}
                  className="form-control"
                  placeholder="INR"
                  value={formData.currency_code || 'INR'}
                  onChange={(e) => handleChange('currency_code', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Live Interactive Receipt Header & Bill Preview Card */}
        {showLivePreview && (
          <div className="card" style={{ border: '2px dashed #003366', background: '#f8fafc' }}>
            <div className="card-header" style={{ background: '#f1f5f9' }}>
              <div className="card-title">
                <FileText size={18} color="#003366" />
                <span>Live Interactive Receipt Header & Bill Preview</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>
                ● Dynamically updates as you type any field above
              </span>
            </div>

            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div
                className="receipt-paper-preview"
                style={{
                  maxWidth: '620px',
                  width: '100%',
                  backgroundColor: '#ffffff',
                  border: '2.5px solid #003366',
                  padding: '24px 20px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
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
                {/* Header: Dynamic Logos & Organization Details */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <img
                    src={logoPreview || `/logo.png?t=${logoTimestamp}`}
                    alt="Logo"
                    style={{ width: '46px', height: '46px', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                    <div className="receipt-title-row">
                      <img src="/hands_heart.png" alt="Emblem" className="receipt-title-emblem" />
                      <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#003366', letterSpacing: '0.5px' }}>
                        {formData.trust_name || 'BRIDGE OF LOVE'}
                      </div>
                      <img src="/hands_heart.png" alt="Emblem" className="receipt-title-emblem" />
                    </div>
                    {parsedTaglines.map((motto, idx) => (
                      <div key={idx} style={{ fontSize: '10.5px', fontWeight: 'bold', color: idx % 2 === 0 ? '#1e293b' : '#b91c1c' }}>
                        {motto.startsWith('“') || motto.startsWith('"') ? motto : `“${motto}”`}
                      </div>
                    ))}
                    {formData.address && (
                      <div style={{ fontSize: '9.5px', color: '#334155', marginTop: '2px', lineHeight: 1.3 }}>
                        {formData.address}
                      </div>
                    )}
                    {(formData.reg_number || formData.pan_number || formData.contact_phone || formData.email) && (
                      <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '3px' }}>
                        {[
                          formData.reg_number ? `Reg: ${formData.reg_number}` : '',
                          formData.pan_number ? `PAN: ${formData.pan_number}` : '',
                          formData.contact_phone ? `Phone: ${formData.contact_phone}` : '',
                          formData.email ? `Email: ${formData.email}` : ''
                        ].filter(Boolean).join('  •  ')}
                      </div>
                    )}
                  </div>
                  <img
                    src={logoPreview || `/logo.png?t=${logoTimestamp}`}
                    alt="Logo"
                    style={{ width: '46px', height: '46px', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </div>

                {/* Banner */}
                <div style={{ background: '#f1f5f9', color: '#003366', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', padding: '6px', marginBottom: '12px' }}>
                  PAYMENT RECEIPT
                </div>

                {/* Voucher Meta Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#003366', fontWeight: 'bold' }}>
                      <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Receipt No.</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Date</th>
                      <th style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                        {formData.receipt_prefix || 'TR/REC'}-1001
                      </td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Received By & Dynamic Signature line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', marginBottom: '16px', padding: '0 6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Received by</div>
                  <div style={{ textAlign: 'center', width: '180px' }}>
                    <div style={{ borderBottom: '1px solid #475569', height: '16px', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a' }}>
                      {formData.signatory_name || 'Authorized Signatory'}
                    </div>
                  </div>
                </div>

                {/* Dynamic Footer */}
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>
                    Thank you for your generous contribution.
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#003366', marginTop: '2px' }}>
                    {formData.signatory_title || `Issued by ${formData.trust_name || 'Bridge of Love'} (Team Members)`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Free SMTP Automated Email Delivery Engine */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Mail size={18} color="#2563eb" />
              <span>Free SMTP Automated Email Engine</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Zero-cost email delivery with official PDF attachments</span>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Provider Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Quick SMTP Presets:</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => applySmtpPreset('gmail-tls')}
              >
                Gmail (Port 587 STARTTLS)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => applySmtpPreset('gmail-ssl')}
              >
                Gmail SSL (Port 465)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => applySmtpPreset('outlook')}
              >
                Outlook / 365 (Port 587)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
                onClick={() => applySmtpPreset('brevo')}
              >
                ★ Brevo (Port 2525 - Render Free Safe)
              </button>
            </div>

            {/* Render Free Tier & Brevo Advisory Alert */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '16px 20px', borderRadius: '10px', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
              <strong>⚡ Important for Brevo & Render Free Tier:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px', marginBottom: 0 }}>
                <li><strong>Port 2525:</strong> Render's Free Tier blocks ports 25, 465, and 587. Brevo on <strong>Port 2525</strong> bypasses the block and works reliably on Render Free Tier (300 free emails/day).</li>
                <li style={{ marginTop: '5px' }}><strong>Sender Email Requirement:</strong> Brevo strictly requires that the <strong>"Sender Email Address (From Email)"</strong> below matches your registered Brevo account email (or an authorized sender in Brevo). <em>Never use @smtp-brevo.com as the From Email.</em></li>
              </ul>
            </div>

            {/* Zero-Cost SMTP Setup Guide */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px', borderRadius: '10px', fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
              <strong>Zero-Cost Free SMTP Setup Guide (e.g. Gmail):</strong>
              <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>You can use any standard Gmail account at zero cost (500 emails/day free limit).</li>
                <li>In your Google Account, enable <strong>2-Step Verification</strong>.</li>
                <li>Go to <strong>Security &gt; App Passwords</strong>, create an App Password named "Trust Receipts".</li>
                <li>Paste your Gmail address below, and paste the 16-letter App Password into the <strong>SMTP Password</strong> field.</li>
                <li>Click <strong>"Test SMTP Connection"</strong> or <strong>"Send Live Test Email"</strong> to verify live delivery!</li>
              </ol>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">SMTP Server Host</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="smtp.gmail.com"
                  value={formData.smtp_host || 'smtp.gmail.com'}
                  onChange={(e) => handleChange('smtp_host', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="587"
                  value={formData.smtp_port || 587}
                  onChange={(e) => {
                    const port = parseInt(e.target.value) || 587;
                    handleChange('smtp_port', port);
                    if (port === 465) handleChange('smtp_secure', true);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Username (Email Address)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="trust.accounts@gmail.com"
                  value={formData.smtp_user || ''}
                  onChange={(e) => handleChange('smtp_user', e.target.value)}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">SMTP App Password (16 letters)</label>
                  {formData.has_smtp_pass && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>✓ Configured in database</span>
                  )}
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ width: '100%', paddingRight: '40px' }}
                    placeholder={formData.has_smtp_pass ? '••••••••' : 'Enter 16-letter Google App Password'}
                    value={formData.smtp_pass || ''}
                    onChange={(e) => handleChange('smtp_pass', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sender Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={formData.trust_name || 'Bridge of Love'}
                  value={formData.smtp_from_name || ''}
                  onChange={(e) => handleChange('smtp_from_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Sender Email Address (From Email)</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. your_registered_email@gmail.com"
                  value={formData.smtp_from_email || ''}
                  onChange={(e) => handleChange('smtp_from_email', e.target.value)}
                />
                <span className="form-help" style={{ color: '#0369a1', marginTop: '4px', display: 'block', fontSize: '11.5px' }}>
                  <strong>Crucial for Brevo:</strong> Enter the exact email address you registered your Brevo account with (or a verified sender in Brevo). <em>Never use @smtp-brevo.com here.</em>
                </span>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleTestSmtp}
                disabled={testingSmtp}
              >
                <Server size={15} />
                <span>{testingSmtp ? 'Testing Connection...' : 'Test SMTP Connection'}</span>
              </button>

              {smtpStatus && (
                <div style={{
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: smtpStatus.success ? '#047857' : '#b91c1c',
                  fontWeight: 600,
                }}>
                  {smtpStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{smtpStatus.message}</span>
                </div>
              )}
            </div>

            {/* Live Test Email Dispatcher */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '16px',
              borderRadius: '10px',
              marginTop: '6px'
            }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                <Send size={13} color="#059669" />
                <span>Send Real Test Receipt Email to Verify Delivery</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ flex: 1, minWidth: '240px' }}
                  placeholder="Enter email to receive test PDF bill (e.g. your email)"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-emerald"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail || !testEmailAddress}
                >
                  <Send size={14} />
                  <span>{sendingTestEmail ? 'Sending Test PDF...' : 'Send Live Test Receipt'}</span>
                </button>
              </div>

              {testEmailStatus && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: testEmailStatus.success ? '#047857' : '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {testEmailStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testEmailStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Sticky Bottom Action Toolbar */}
        <div 
          className="settings-save-toolbar"
          style={{
            position: 'sticky',
            bottom: '16px',
            background: '#ffffff',
            border: '1.5px solid #0f172a',
            borderRadius: '14px',
            padding: '14px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDirty ? (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} />
                <span>You have unsaved changes. All receipts and previews are currently streaming live edits.</span>
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>All settings are saved and synchronized across the entire application.</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
            >
              <RotateCcw size={15} />
              <span>Discard Changes</span>
            </button>

            <button
              type="submit"
              className="btn btn-emerald"
              style={{ padding: '10px 24px', fontSize: '14px' }}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Saving All Settings...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
