import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileDown, 
  PlusCircle, 
  Eye, 
  Mail, 
  Send, 
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ReceiptsView({
  receipts,
  heads,
  settings,
  onOpenNewReceipt,
  onExportAllPdf,
  onViewReceipt,
  onShareWhatsApp,
  onResendEmail,
  onFilterChange,
  filterState,
}) {
  const [searchTerm, setSearchTerm] = useState(filterState.search || '');
  const [selectedHead, setSelectedHead] = useState(filterState.head_id || '');
  const [selectedMode, setSelectedMode] = useState(filterState.payment_mode || '');
  const [resendingId, setResendingId] = useState(null);

  const currencySymbol = settings?.currency_symbol || '₹';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      search: searchTerm,
      head_id: selectedHead,
      payment_mode: selectedMode,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedHead('');
    setSelectedMode('');
    onFilterChange({ search: '', head_id: '', payment_mode: '' });
  };

  const handleResend = async (r) => {
    setResendingId(r.id);
    await onResendEmail(r);
    setResendingId(null);
  };

  const totalFilteredAmount = receipts.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  return (
    <div className="view-body">
      {/* Control Bar: Filters & Export Actions */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '34px', width: '100%' }}
              placeholder="Search by receipt no, donor, PAN, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          {/* Payment Mode Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-control"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={14} />
            <span>Apply Filter</span>
          </button>

          {(searchTerm || selectedHead || selectedMode) && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetFilters}>
              Reset
            </button>
          )}

          {/* Prominent One-Click All Accounts PDF Export */}
          <div className="receipts-top-actions">
            <button
              type="button"
              className="btn btn-one-click-pdf"
              onClick={onExportAllPdf}
              title="Download consolidated PDF ledger of all accounts in 1 click"
            >
              <FileDown size={15} />
              <span>One-Click All Accounts PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-emerald"
              onClick={onOpenNewReceipt}
            >
              <PlusCircle size={15} />
              <span>New Receipt</span>
            </button>
          </div>
        </form>
      </div>

      {/* Receipts Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>Official Receipts & Daybook</span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
              ({receipts.length} records • Total: <strong>{currencySymbol} {totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>)
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Member Information</th>
                <th>Payment Mode</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Email (SMTP)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length > 0 ? (
                receipts.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="receipt-num-badge">{r.receipt_number}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(r.receipt_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.donor_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
                        {r.donor_pan && <span>PAN: {r.donor_pan}</span>}
                        {r.donor_phone && <span>Tel: {r.donor_phone}</span>}
                      </div>
                      {r.donor_email && (
                        <div style={{ fontSize: '11px', color: '#0284c7' }}>{r.donor_email}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{r.payment_mode}</span>
                      {r.cheque_or_tx_ref && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Ref: {r.cheque_or_tx_ref}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {currencySymbol} {parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`status-badge ${r.email_status ? r.email_status.toLowerCase().replace(/[^a-z]/g, '') : 'pending'}`}>
                          {r.email_status || 'Pending'}
                        </span>
                        {r.donor_email && (
                          <button
                            className="btn btn-outline btn-icon"
                            style={{ padding: '4px' }}
                            title="Resend receipt via SMTP email"
                            onClick={() => handleResend(r)}
                            disabled={resendingId === r.id}
                          >
                            <RefreshCw size={12} className={resendingId === r.id ? 'spin' : ''} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* View / Print Receipt */}
                        <button
                          className="btn btn-outline btn-icon"
                          title="View / Print Printable Trust Receipt"
                          onClick={() => onViewReceipt(r)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* MANUAL WHATSAPP BUTTON */}
                        <button
                          className="btn btn-whatsapp"
                          title="Share Receipt directly on WhatsApp with pre-filled message"
                          onClick={() => onShareWhatsApp(r)}
                        >
                          WhatsApp
                        </button>

                        {/* Single Vector PDF Download */}
                        <a
                          href={`http://localhost:5000/api/receipts/${r.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-icon"
                          title="Download Official 80G Vector PDF"
                        >
                          <FileDown size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No receipts matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
