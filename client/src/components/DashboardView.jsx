import React from 'react';
import { 
  IndianRupee, 
  Receipt, 
  Users, 
  TrendingUp, 
  FileDown, 
  PlusCircle, 
  ExternalLink,
  ShieldCheck,
  Send,
  Eye,
  CreditCard
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  settings, 
  onOpenNewReceipt, 
  onExportAllPdf, 
  onViewReceipt, 
  onShareWhatsApp,
  setActiveTab 
}) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const formatCurrency = (val) => {
    return `${currencySymbol} ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="view-body">
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card emerald">
          <div className="metric-header">
            <span className="metric-title">Total Contributions</span>
            <div className="metric-icon-box" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(stats?.totalCollections)}</div>
          <div className="metric-sub positive">
            <TrendingUp size={13} />
            <span>Audited Member Vouchers</span>
          </div>
        </div>

        <div className="metric-card sky">
          <div className="metric-header">
            <span className="metric-title">This Month Inflows</span>
            <div className="metric-icon-box" style={{ color: '#0284c7', backgroundColor: '#f0f9ff' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(stats?.monthCollections)}</div>
          <div className="metric-sub">
            <span>{stats?.monthReceipts || 0} member receipts this month</span>
          </div>
        </div>

        <div className="metric-card indigo">
          <div className="metric-header">
            <span className="metric-title">Total Receipts Issued</span>
            <div className="metric-icon-box" style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="metric-value">{stats?.totalReceipts || 0}</div>
          <div className="metric-sub">
            <span>Official Vouchers</span>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-header">
            <span className="metric-title">Trust Members</span>
            <div className="metric-icon-box" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">{stats?.totalDonors || 0}</div>
          <div className="metric-sub">
            <span>Registered Member Directory</span>
          </div>
        </div>
      </div>

      {/* Member Inflow Breakdown & Quick Action Bar */}
      <div className="dashboard-split-grid">
        {/* Payment Method Distribution Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="#003366" />
              <span>Monthly Member Contributions by Payment Mode</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Receipts Issued</th>
                  <th style={{ textAlign: 'right' }}>Total Collected</th>
                </tr>
              </thead>
              <tbody>
                {stats?.modeBreakdown?.length > 0 ? (
                  stats.modeBreakdown.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.mode}</td>
                      <td>
                        <span className="receipt-num-badge">{m.count}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(m.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No member receipts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Auditing & One-Click PDF Action Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <img src="/logo.png" alt="Bridge of Love" style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain' }} />
              <span>Trust Compliance & Export</span>
            </div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                One-Click Complete Accounts Statement
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                Generate an official, auditor-ready multi-page statement containing full receipts ledger, payment method distribution, and trustee certification in one click.
              </p>
              <button
                className="btn btn-one-click-pdf"
                style={{ width: '100%' }}
                onClick={onExportAllPdf}
              >
                <FileDown size={16} />
                <span>Download All Accounts PDF</span>
              </button>
            </div>

            <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#065f46', marginBottom: '4px' }}>
                Generate New Bill / 80G Receipt
              </div>
              <p style={{ fontSize: '12px', color: '#047857', marginBottom: '14px' }}>
                Issue a numbered receipt, automatically convert amount to words, send to email via SMTP, and share on WhatsApp.
              </p>
              <button
                className="btn btn-emerald"
                style={{ width: '100%' }}
                onClick={onOpenNewReceipt}
              >
                <PlusCircle size={16} />
                <span>Create New Receipt Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Receipts Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>Recent Receipts Issued</span>
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setActiveTab('receipts')}
          >
            <span>View Full Daybook</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Donor Name & PAN</th>
                <th>Account Head</th>
                <th>Payment Mode</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Email Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentReceipts?.length > 0 ? (
                stats.recentReceipts.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="receipt-num-badge">{r.receipt_number}</span>
                    </td>
                    <td>
                      {new Date(r.receipt_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.donor_name}</div>
                      {r.donor_pan && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {r.donor_pan}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{r.head_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px' }}>{r.payment_mode}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(parseFloat(r.amount))}
                    </td>
                    <td>
                      <span className={`status-badge ${r.email_status ? r.email_status.toLowerCase().replace(/[^a-z]/g, '') : 'pending'}`}>
                        {r.email_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-icon"
                          title="View / Print Receipt"
                          onClick={() => onViewReceipt(r)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-whatsapp"
                          title="Send on WhatsApp"
                          onClick={() => onShareWhatsApp(r)}
                        >
                          WhatsApp
                        </button>
                        <a
                          href={`http://localhost:5000/api/receipts/${r.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-icon"
                          title="Download PDF"
                        >
                          <FileDown size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No recent receipts found. Click "Issue New Receipt" to start.
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
