import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import {
  Search,
  Filter,
  PlusCircle,
  Trash2,
  Calendar,
  CreditCard,
  TrendingDown,
  ArrowDownRight,
  FileText,
  AlertCircle,
  Tag,
  CheckCircle,
  Eye,
  X,
  FileDown
} from 'lucide-react';

export default function ExpensesView({
  expenses = [],
  heads = [],
  settings = {},
  stats = {},
  onOpenNewExpense,
  onDeleteExpense,
  onFilterChange,
  onExportExpensesPdf,
  filterState = {},
}) {
  const [searchTerm, setSearchTerm] = useState(filterState.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filterState.category || '');
  const [selectedMode, setSelectedMode] = useState(filterState.payment_mode || '');
  const [selectedYear, setSelectedYear] = useState(filterState.year || '');
  const [selectedMonth, setSelectedMonth] = useState(filterState.month || '');
  const [deletingId, setDeletingId] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);

  React.useEffect(() => {
    setSearchTerm(filterState.search || '');
    setSelectedCategory(filterState.category || '');
    setSelectedMode(filterState.payment_mode || '');
    setSelectedYear(filterState.year || '');
    setSelectedMonth(filterState.month || '');
  }, [filterState]);

  const currencySymbol = settings?.currency_symbol || '₹';

  // Available years from stats or current year
  const availableYears = stats?.availableYears || [new Date().getFullYear()];

  const months = [
    { value: '1', name: '01 - January' },
    { value: '2', name: '02 - February' },
    { value: '3', name: '03 - March' },
    { value: '4', name: '04 - April' },
    { value: '5', name: '05 - May' },
    { value: '6', name: '06 - June' },
    { value: '7', name: '07 - July' },
    { value: '8', name: '08 - August' },
    { value: '9', name: '09 - September' },
    { value: '10', name: '10 - October' },
    { value: '11', name: '11 - November' },
    { value: '12', name: '12 - December' },
  ];

  // Compute unique categories from existing expenses + standard list
  const availableCategories = Array.from(
    new Set([
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
      ...expenses.map((e) => e.category).filter(Boolean),
    ])
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({
        search: searchTerm,
        category: selectedCategory,
        payment_mode: selectedMode,
        year: selectedYear,
        month: selectedMonth,
      });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedMode('');
    setSelectedYear('');
    setSelectedMonth('');
    if (onFilterChange) {
      onFilterChange({ search: '', category: '', payment_mode: '', year: '', month: '' });
    }
  };

  const handleDelete = async (id, expNum) => {
    if (window.confirm(`Are you sure you want to delete expense voucher ${expNum}?`)) {
      setDeletingId(id);
      try {
        await onDeleteExpense(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const totalFilteredAmount = expenses.reduce(
    (acc, curr) => acc + parseFloat(curr.amount || 0),
    0
  );

  const formatCurrency = (val) => {
    return `${currencySymbol} ${(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleExportPdf = () => {
    if (onExportExpensesPdf) {
      onExportExpensesPdf({
        search: searchTerm,
        category: selectedCategory,
        payment_mode: selectedMode,
        year: selectedYear,
        month: selectedMonth,
      });
    } else {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedMode) params.append('payment_mode', selectedMode);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedMonth) params.append('month', selectedMonth);
      window.open(`${API_BASE}/expenses/export/all-pdf?${params.toString()}`, '_blank');
    }
  };

  return (
    <div className="view-body">
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card rose">
          <div className="metric-header">
            <span className="metric-title">Total Outflows & Expenses</span>
            <div
              className="metric-icon-box"
              style={{ color: '#e11d48', backgroundColor: '#ffe4e6' }}
            >
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#be123c' }}>
            {formatCurrency(totalFilteredAmount)}
          </div>
          <div className="metric-sub">
            <span>{expenses.length} Filtered Vouchers</span>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-header">
            <span className="metric-title">This Month Outflow</span>
            <div
              className="metric-icon-box"
              style={{ color: '#d97706', backgroundColor: '#fffbeb' }}
            >
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="metric-value">
            {formatCurrency(stats?.monthExpenses || 0)}
          </div>
          <div className="metric-sub">
            <span>{stats?.monthExpensesCount || 0} vouchers in {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="metric-card sky">
          <div className="metric-header">
            <span className="metric-title">Net Available Balance</span>
            <div
              className="metric-icon-box"
              style={{
                color: (stats?.netBalance || 0) >= 0 ? '#0284c7' : '#e11d48',
                backgroundColor: (stats?.netBalance || 0) >= 0 ? '#f0f9ff' : '#ffe4e6',
              }}
            >
              <CreditCard size={18} />
            </div>
          </div>
          <div
            className="metric-value"
            style={{
              color: (stats?.netBalance || 0) >= 0 ? '#0284c7' : '#e11d48',
            }}
          >
            {formatCurrency(stats?.netBalance || 0)}
          </div>
          <div className="metric-sub">
            <span>Inflows minus Outflows</span>
          </div>
        </div>

        <div className="metric-card indigo">
          <div className="metric-header">
            <span className="metric-title">Total Expense Vouchers</span>
            <div
              className="metric-icon-box"
              style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}
            >
              <FileText size={18} />
            </div>
          </div>
          <div className="metric-value">{stats?.totalExpensesCount || expenses.length}</div>
          <div className="metric-sub">
            <span>All-Time Recorded Vouchers</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Action Button */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '11px',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '34px', width: '100%' }}
              placeholder="Search by voucher #, payee, bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Year Filter */}
          <div style={{ minWidth: '110px' }}>
            <select
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>Year {yr}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="form-control"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={14} />
            <span>Filter</span>
          </button>

          {(searchTerm || selectedCategory || selectedMode || selectedYear || selectedMonth) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleResetFilters}
            >
              Clear
            </button>
          )}

          {/* Right Aligned Export PDF & Add Buttons */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-one-click-pdf"
              onClick={handleExportPdf}
              title="Download consolidated PDF ledger of all filtered expenses"
              style={{ background: 'linear-gradient(135deg, #881337 0%, #9f1239 100%)' }}
            >
              <FileDown size={15} />
              <span>Export Expenses PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-rose"
              onClick={onOpenNewExpense}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={15} />
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Table Card */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div className="card-title">
            <FileText size={18} color="#be123c" />
            <span>Expense & Payment Vouchers Ledger</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {expenses.length} Records
            </span>
            {(selectedYear || selectedMonth) && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#be123c',
                  background: '#ffe4e6',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Filtered: {selectedMonth ? months.find(m => m.value === selectedMonth)?.name : ''} {selectedYear ? `Year ${selectedYear}` : ''}
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#be123c' }}>
            Total Filtered: {formatCurrency(totalFilteredAmount)}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Paid To (Payee)</th>
                <th>Category</th>
                <th>Mode & Ref</th>
                <th>Purpose / Notes</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>PDF & Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      color: '#94a3b8',
                    }}
                  >
                    <ArrowDownRight
                      size={40}
                      style={{
                        margin: '0 auto 12px',
                        display: 'block',
                        opacity: 0.4,
                      }}
                    />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>
                      No expense records found
                    </div>
                    <p style={{ fontSize: '13px', margin: '4px 0 16px 0' }}>
                      {(searchTerm || selectedCategory || selectedMode || selectedYear || selectedMonth)
                        ? 'Try clearing your filters to see more results.'
                        : 'Click "Record Expense" to log your first expenditure voucher.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-rose btn-sm"
                      onClick={onOpenNewExpense}
                    >
                      <PlusCircle size={14} />
                      <span>Record Expense</span>
                    </button>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  let formattedDate = exp.expense_date;
                  try {
                    formattedDate = new Date(exp.expense_date).toLocaleDateString(
                      'en-IN',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }
                    );
                  } catch (e) {
                    formattedDate = String(exp.expense_date);
                  }

                  return (
                    <tr key={exp.id}>
                      {/* Voucher # */}
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
                            display: 'inline-block',
                          }}
                        >
                          {exp.expense_number}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>

                      {/* Payee */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {exp.payee_name}
                        </div>
                        {exp.head_name && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Fund: {exp.head_name}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#334155',
                          }}
                        >
                          <Tag size={11} color="#64748b" />
                          <span>{exp.category}</span>
                        </span>
                      </td>

                      {/* Payment Mode & Ref */}
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                          {exp.payment_mode}
                        </div>
                        {(exp.reference_no || exp.bill_number) && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              fontFamily: 'monospace',
                            }}
                          >
                            {exp.bill_number && `Bill: ${exp.bill_number} `}
                            {exp.reference_no && `Ref: ${exp.reference_no}`}
                          </div>
                        )}
                      </td>

                      {/* Notes / Purpose */}
                      <td style={{ maxWidth: '240px' }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: '#475569',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={exp.notes}
                        >
                          {exp.notes || '—'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '14.5px',
                          color: '#be123c',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCurrency(parseFloat(exp.amount || 0))}
                      </td>

                      {/* Actions: View, PDF Download, Delete */}
                      <td style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {/* View details */}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '5px 7px' }}
                            title="View Voucher Details"
                            onClick={() => setViewingExpense(exp)}
                          >
                            <Eye size={13} />
                          </button>

                          {/* Download Voucher PDF */}
                          <a
                            href={`${API_BASE}/expenses/${exp.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '5px 7px', color: '#be123c', borderColor: '#fecdd3' }}
                            title="Download Official Voucher PDF"
                          >
                            <FileDown size={13} />
                          </a>

                          {/* Delete */}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '5px 7px' }}
                            title="Delete Voucher"
                            disabled={deletingId === exp.id}
                            onClick={() => handleDelete(exp.id, exp.expense_number)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Expense Detail Modal */}
      {viewingExpense && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#be123c" />
                <h3 style={{ margin: 0, fontSize: '17px' }}>Expense Voucher Details</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingExpense(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase' }}>
                  Official Expense Voucher
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#9f1239', margin: '4px 0' }}>
                  {viewingExpense.expense_number}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#be123c' }}>
                  {formatCurrency(parseFloat(viewingExpense.amount || 0))}
                </div>
                {viewingExpense.amount_words && (
                  <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                    {viewingExpense.amount_words}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Paid To (Payee):</span>
                  <strong style={{ color: '#0f172a' }}>{viewingExpense.payee_name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{viewingExpense.category}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Voucher Date:</span>
                  <span>{new Date(viewingExpense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <span style={{ fontWeight: 600 }}>{viewingExpense.payment_mode}</span>
                </div>

                {viewingExpense.reference_no && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Txn / UTR / Ref:</span>
                    <span style={{ fontFamily: 'monospace' }}>{viewingExpense.reference_no}</span>
                  </div>
                )}

                {viewingExpense.bill_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Vendor Bill / Inv #:</span>
                    <span style={{ fontFamily: 'monospace' }}>{viewingExpense.bill_number}</span>
                  </div>
                )}

                {viewingExpense.head_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Account Head:</span>
                    <span>{viewingExpense.head_name}</span>
                  </div>
                )}

                {viewingExpense.notes && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Description / Purpose:</span>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                      {viewingExpense.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={`${API_BASE}/expenses/${viewingExpense.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-rose"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <FileDown size={15} />
                <span>Download Voucher PDF</span>
              </a>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setViewingExpense(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

