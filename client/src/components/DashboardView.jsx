import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import {
  IndianRupee,
  Receipt,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  FileDown,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Eye,
  CreditCard,
  Tag,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardView({
  stats,
  settings,
  onOpenNewReceipt,
  onOpenNewExpense,
  onExportAllPdf,
  onViewReceipt,
  onShareWhatsApp,
  setActiveTab,
  onPeriodChange,
  periodState = {},
  onSelectMonthFilter,
}) {
  const currencySymbol = settings?.currency_symbol || '₹';

  const [selectedYear, setSelectedYear] = useState(periodState.year || (stats?.selectedYear || new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(periodState.month || '');

  const formatCurrency = (val) => {
    return `${currencySymbol} ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const availableYears = stats?.availableYears || [new Date().getFullYear()];

  const months = [
    { value: '1', name: 'January', short: 'Jan' },
    { value: '2', name: 'February', short: 'Feb' },
    { value: '3', name: 'March', short: 'Mar' },
    { value: '4', name: 'April', short: 'Apr' },
    { value: '5', name: 'May', short: 'May' },
    { value: '6', name: 'June', short: 'Jun' },
    { value: '7', name: 'July', short: 'Jul' },
    { value: '8', name: 'August', short: 'Aug' },
    { value: '9', name: 'September', short: 'Sep' },
    { value: '10', name: 'October', short: 'Oct' },
    { value: '11', name: 'November', short: 'Nov' },
    { value: '12', name: 'December', short: 'Dec' },
  ];

  const handleApplyPeriod = (yearVal, monthVal) => {
    setSelectedYear(yearVal);
    setSelectedMonth(monthVal);
    if (onPeriodChange) {
      onPeriodChange({ year: yearVal, month: monthVal });
    }
  };

  const handleResetPeriod = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth('');
    if (onPeriodChange) {
      onPeriodChange({ year: new Date().getFullYear(), month: '' });
    }
  };

  const currentMonthName = selectedMonth
    ? months.find(m => m.value === String(selectedMonth))?.name
    : 'All Months';

  return (
    <div className="view-body">
      {/* 1. Year & Month Accounting Filter Toolbar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#003366" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Financial Period:
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#003366',
              background: '#e0f2fe',
              padding: '3px 10px',
              borderRadius: '12px'
            }}>
              {selectedYear === 'all' ? 'All Recorded Years' : `Year ${selectedYear}`} • {currentMonthName}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* Year Dropdown */}
            <select
              className="form-control"
              style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
              value={selectedYear}
              onChange={(e) => handleApplyPeriod(e.target.value, selectedMonth)}
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>Year {yr}</option>
              ))}
            </select>

            {/* Month Dropdown */}
            <select
              className="form-control"
              style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
              value={selectedMonth}
              onChange={(e) => handleApplyPeriod(selectedYear, e.target.value)}
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>

            {(selectedMonth || selectedYear !== new Date().getFullYear()) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetPeriod}
                title="Reset to current year"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row (Period Specific) */}
      <div className="metrics-grid">
        <div className="metric-card emerald">
          <div className="metric-header">
            <span className="metric-title">
              {selectedMonth ? `${currentMonthName} Inflows` : (selectedYear === 'all' ? 'Total Inflows (All Time)' : `Inflows (${selectedYear})`)}
            </span>
            <div className="metric-icon-box" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(stats?.totalCollections)}</div>
          <div className="metric-sub positive">
            <TrendingUp size={13} />
            <span>{stats?.totalReceipts || 0} Member Receipts Recorded</span>
          </div>
        </div>

        <div className="metric-card rose">
          <div className="metric-header">
            <span className="metric-title">
              {selectedMonth ? `${currentMonthName} Expenses` : (selectedYear === 'all' ? 'Total Expenses (All Time)' : `Expenses (${selectedYear})`)}
            </span>
            <div className="metric-icon-box" style={{ color: '#e11d48', backgroundColor: '#ffe4e6' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#be123c' }}>
            {formatCurrency(stats?.totalExpenses)}
          </div>
          <div className="metric-sub">
            <span>{stats?.totalExpensesCount || 0} Expense Vouchers</span>
          </div>
        </div>

        <div className="metric-card sky">
          <div className="metric-header">
            <span className="metric-title">
              {selectedMonth ? `${currentMonthName} Net Balance` : (selectedYear === 'all' ? 'Net Balance (All Time)' : `Net Balance (${selectedYear})`)}
            </span>
            <div className="metric-icon-box" style={{
              color: (stats?.netBalance || 0) >= 0 ? '#0284c7' : '#e11d48',
              backgroundColor: (stats?.netBalance || 0) >= 0 ? '#f0f9ff' : '#ffe4e6'
            }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: (stats?.netBalance || 0) >= 0 ? '#0284c7' : '#e11d48' }}>
            {formatCurrency(stats?.netBalance)}
          </div>
          <div className="metric-sub">
            <span>Inflows minus Outflows</span>
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

      {/* Monthly Summary Strip */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
            Current Calendar Month ({new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}):
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Inflow: </span>
            <strong style={{ color: '#059669' }}>{formatCurrency(stats?.monthCollections)}</strong>
            <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>({stats?.monthReceipts || 0} receipts)</span>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
            <span style={{ color: '#64748b' }}>Expense: </span>
            <strong style={{ color: '#e11d48' }}>{formatCurrency(stats?.monthExpenses)}</strong>
            <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>({stats?.monthExpensesCount || 0} vouchers)</span>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
            <span style={{ color: '#64748b' }}>Month Net: </span>
            <strong style={{ color: (stats?.monthNetBalance || 0) >= 0 ? '#0284c7' : '#e11d48' }}>
              {formatCurrency(stats?.monthNetBalance)}
            </strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-emerald btn-sm"
            onClick={onOpenNewReceipt}
            style={{ padding: '6px 12px' }}
          >
            <PlusCircle size={13} />
            <span>+ Receipt</span>
          </button>
          <button
            type="button"
            className="btn btn-rose btn-sm"
            onClick={onOpenNewExpense}
            style={{ padding: '6px 12px' }}
          >
            <ArrowDownRight size={13} />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* 2. MONTHLY COMPARATIVE TABLE (DONATIONS VS EXPENSES) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">
            <TrendingUp size={18} color="#003366" />
            <span>Monthly Inflows vs Expenses Breakdown (Year {stats?.comparisonYear || selectedYear || 2026})</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            12-Month Audited View
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th style={{ textAlign: 'right' }}>Donations / Inflows (₹)</th>
                <th style={{ textAlign: 'center' }}>Receipts</th>
                <th style={{ textAlign: 'right' }}>Expenses / Outflows (₹)</th>
                <th style={{ textAlign: 'center' }}>Vouchers</th>
                <th style={{ textAlign: 'right' }}>Net Balance (₹)</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>View Records</th>
              </tr>
            </thead>
            <tbody>
              {stats?.monthlyComparison?.map((item) => {
                const isSelected = String(selectedMonth) === String(item.month);
                const hasActivity = item.donations > 0 || item.expenses > 0;
                return (
                  <tr
                    key={item.month}
                    style={{
                      backgroundColor: isSelected ? '#f0f9ff' : (hasActivity ? '#ffffff' : '#fcfcfc'),
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: hasActivity ? '#0f172a' : '#64748b' }}>
                        {item.monthName} {stats?.comparisonYear}
                      </span>
                    </td>

                    {/* Donations */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.donations > 0 ? '#059669' : '#94a3b8' }}>
                      {formatCurrency(item.donations)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="receipt-num-badge" style={{ background: item.receiptsCount > 0 ? '#ecfdf5' : '#f1f5f9', color: item.receiptsCount > 0 ? '#065f46' : '#94a3b8' }}>
                        {item.receiptsCount}
                      </span>
                    </td>

                    {/* Expenses */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.expenses > 0 ? '#be123c' : '#94a3b8' }}>
                      {formatCurrency(item.expenses)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="receipt-num-badge" style={{ background: item.expensesCount > 0 ? '#ffe4e6' : '#f1f5f9', color: item.expensesCount > 0 ? '#be123c' : '#94a3b8' }}>
                        {item.expensesCount}
                      </span>
                    </td>

                    {/* Net Balance */}
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: item.net > 0 ? '#059669' : (item.net < 0 ? '#be123c' : '#64748b')
                    }}>
                      {formatCurrency(item.net)}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      {item.net > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>
                          Surplus
                        </span>
                      ) : item.net < 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#be123c', background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px' }}>
                          Deficit
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Balanced</span>
                      )}
                    </td>

                    {/* Quick navigation */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          title={`View receipts for ${item.shortName} ${stats?.comparisonYear}`}
                          onClick={() => {
                            if (onSelectMonthFilter) {
                              onSelectMonthFilter('receipts', stats?.comparisonYear, item.month);
                            } else {
                              setActiveTab('receipts');
                            }
                          }}
                        >
                          Receipts
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', color: '#be123c', borderColor: '#fecdd3' }}
                          title={`View expenses for ${item.shortName} ${stats?.comparisonYear}`}
                          onClick={() => {
                            if (onSelectMonthFilter) {
                              onSelectMonthFilter('expenses', stats?.comparisonYear, item.month);
                            } else {
                              setActiveTab('expenses');
                            }
                          }}
                        >
                          Expenses
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Inflow Breakdown & Quick Action Bar */}
      <div className="dashboard-split-grid">
        {/* Payment Method Distribution Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="#003366" />
              <span>Receipts by Payment Mode ({selectedYear === 'all' ? 'All Time' : selectedYear})</span>
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
                      No receipts recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Category Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Tag size={18} color="#be123c" />
              <span>Expenses by Category ({selectedYear === 'all' ? 'All Time' : selectedYear})</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Vouchers</th>
                  <th style={{ textAlign: 'right' }}>Total Disbursed</th>
                </tr>
              </thead>
              <tbody>
                {stats?.expenseCategoryBreakdown?.length > 0 ? (
                  stats.expenseCategoryBreakdown.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.category}</td>
                      <td>
                        <span className="receipt-num-badge" style={{ background: '#ffe4e6', color: '#be123c' }}>
                          {c.count}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#be123c' }}>
                        {formatCurrency(c.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No expenses recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Compliance Export Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#003366', marginBottom: '4px' }}>
              All Accounts & Receipts Statement
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Export official audited multi-page PDF statement of all member donation receipts and certification.
            </p>
          </div>
          <button
            className="btn btn-one-click-pdf"
            onClick={onExportAllPdf}
          >
            <FileDown size={15} />
            <span>Download All Receipts PDF</span>
          </button>
        </div>

        <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '10px', border: '1px solid #fecdd3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#9f1239', marginBottom: '4px' }}>
              Consolidated Expenses Ledger Statement
            </div>
            <p style={{ fontSize: '12px', color: '#be123c', marginBottom: '12px' }}>
              Export official audited PDF statement of trust expenditures and payment vouchers for this period.
            </p>
          </div>
          <a
            href={`${API_BASE}/expenses/export/all-pdf?year=${selectedYear}&month=${selectedMonth}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-rose"
            style={{ textDecoration: 'none', justifyContent: 'center' }}
          >
            <FileDown size={15} />
            <span>Download Expenses PDF</span>
          </a>
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
                          href={`${API_BASE}/receipts/${r.id}/pdf`}
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

      {/* Recent Expenses Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <div className="card-title">
            <span style={{ color: '#be123c' }}>Recent Expenses & Outflows</span>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setActiveTab('expenses')}
          >
            <span>View All Expenses</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Paid To (Payee)</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Notes / Bill Ref</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentExpenses?.length > 0 ? (
                stats.recentExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#be123c',
                          background: '#ffe4e6',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {exp.expense_number}
                      </span>
                    </td>
                    <td>
                      {new Date(exp.expense_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {exp.payee_name}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{exp.payment_mode}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {exp.bill_number ? `Bill: ${exp.bill_number} ` : ''}
                      {exp.notes ? `(${exp.notes})` : ''}
                      {!exp.bill_number && !exp.notes ? '—' : ''}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#be123c' }}>
                      {formatCurrency(parseFloat(exp.amount))}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a
                        href={`${API_BASE}/expenses/${exp.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', color: '#be123c', borderColor: '#fecdd3' }}
                        title="Download Voucher PDF"
                      >
                        <FileDown size={13} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No expenses recorded yet. Click "Record Expense" to log expenditures.
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
