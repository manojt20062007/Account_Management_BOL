import React, { useState } from 'react';
import { X, ArrowDownRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { numberToWordsINR } from '../utils/numberToWords';

const DEFAULT_CATEGORIES = [
  'Annadanam & Groceries',
  'Healthcare & Medical Aid',
  'Education & Student Support',
  'Rent & Premises Maintenance',
  'Utilities & Electricity',
  'Transport & Fuel',
  'Staff Honorarium & Stipend',
  'Puja & Festival Celebration',
  'Office, Printing & Stationery',
  'Miscellaneous & Contingency',
];

export default function NewExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  heads = [],
  settings = {},
}) {
  const [formData, setFormData] = useState({
    payee_name: '',
    category: 'Annadanam & Groceries',
    custom_category: '',
    amount: '',
    payment_mode: 'UPI',
    expense_date: new Date().toISOString().slice(0, 10),
    reference_no: '',
    bill_number: '',
    head_id: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currencySymbol = settings?.currency_symbol || '₹';
  const amountWords = formData.amount && !isNaN(formData.amount) && parseFloat(formData.amount) > 0
    ? numberToWordsINR(formData.amount)
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.payee_name.trim()) {
      setError('Please specify who was paid (Vendor / Beneficiary name).');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    const finalCategory = formData.category === '__custom__'
      ? formData.custom_category.trim()
      : formData.category;

    if (!finalCategory) {
      setError('Please select or specify an expense category.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        payee_name: formData.payee_name.trim(),
        category: finalCategory,
        amount: amountNum,
        payment_mode: formData.payment_mode,
        expense_date: formData.expense_date,
        reference_no: formData.reference_no.trim(),
        bill_number: formData.bill_number.trim(),
        head_id: formData.head_id ? parseInt(formData.head_id) : null,
        notes: formData.notes.trim(),
      });
      // Reset form
      setFormData({
        payee_name: '',
        category: 'Annadanam & Groceries',
        custom_category: '',
        amount: '',
        payment_mode: 'UPI',
        expense_date: new Date().toISOString().slice(0, 10),
        reference_no: '',
        bill_number: '',
        head_id: '',
        notes: '',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense voucher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ffe4e6',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ArrowDownRight size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>Record Expense Voucher</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Track and audit trust funds disbursed for charitable welfare & operations
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px 24px' }}>
            {/* Payee / Paid To */}
            <div className="form-group">
              <label className="form-label">
                Paid To (Vendor / Beneficiary / Staff) <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Sri Krishna Wholesale Provisions, Apollo Pharmacy, Staff Name"
                value={formData.payee_name}
                onChange={(e) => setFormData({ ...formData, payee_name: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Category & Custom Category */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Expense Category <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Enter Custom Category...</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Date <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.category === '__custom__' && (
              <div className="form-group">
                <label className="form-label">
                  Custom Category Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Solar Panel Installation, Medical Camp Tent Rental"
                  value={formData.custom_category}
                  onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Amount & Mode */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Amount ({currencySymbol}) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Amount in words live preview */}
            {amountWords && (
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                marginBottom: '16px',
                fontSize: '12.5px',
                color: '#475569'
              }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Amount in Words: </span>
                <em>{amountWords}</em>
              </div>
            )}

            {/* Reference & Bill # */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Txn / UTR / Cheque Ref No</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. UPI/261014/123456 or UTR-982138"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vendor Bill / Invoice #</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. INV-2026-991, Cash Memo 45"
                  value={formData.bill_number}
                  onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                />
              </div>
            </div>

            {/* Optional Head link */}
            {heads.length > 0 && (
              <div className="form-group">
                <label className="form-label">Allocate to Fund / Account Head (Optional)</label>
                <select
                  className="form-control"
                  value={formData.head_id}
                  onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                >
                  <option value="">-- General Trust Expense --</option>
                  {heads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.code ? `(${h.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Description / Purpose / Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Details of the expenditure, items purchased, purpose of charitable outreach..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-rose"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={16} />
              <span>{submitting ? 'Recording...' : 'Record Expense Voucher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

