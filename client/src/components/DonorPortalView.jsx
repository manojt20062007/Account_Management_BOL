import React, { useState, useEffect } from 'react';
import { Download, Eye, FileText, CheckCircle2, Clock, Calendar, DollarSign, User, MapPin, Mail, Phone, CreditCard, LogOut, RefreshCw, Share2 } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function DonorPortalView({
  user,
  token,
  settings,
  onLogout,
  onViewReceipt,
  onShareWhatsApp,
}) {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'bills' | 'profile'

  const currencySymbol = settings?.currency_symbol || '₹';
  const trustName = settings?.trust_name || 'Anbin Unavu';

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/portal`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setPortalData(result.data);
      }
    } catch (err) {
      console.error('Failed to load member portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [token]);

  const downloadPdf = (receipt) => {
    const url = `${API_BASE}/receipts/${receipt.id}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receipt.receipt_number.replace(/[\/\\]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = portalData?.summary || {
    totalContributed: 0,
    totalReceipts: 0,
    yearContributed: 0,
    monthsPaidCount: 0,
    currentYear: new Date().getFullYear(),
  };

  const monthlyBreakdown = portalData?.monthlyBreakdown || [];
  const receipts = portalData?.receipts || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Top Navigation Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Trust Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: '42px', height: '42px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Mother Teresa Cameo Oval */}
            <div style={{
              width: '42px',
              height: '52px',
              borderRadius: '50%',
              border: '1.5px solid #003366',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              <img
                src="/mother.png"
                alt="Mother Teresa"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#003366', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                அன்பின் உணவு • MEMBER PORTAL
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#003366', lineHeight: 1.2 }}>
                {trustName}
              </div>
            </div>
          </div>

          {/* Member Profile Badge & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#003366',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px'
              }}>
                {(user?.full_name || 'M')[0].toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                  {user?.full_name || 'Member'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {user?.phone ? `📱 ${user.phone}` : (user?.email || 'Member')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.color = '#64748b'; }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #002244 0%, #003366 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(0, 51, 102, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              🙏 NAMASTE & GREETINGS
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0' }}>
              Welcome back, {user?.full_name}!
            </h1>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              Track your monthly contribution history, see which months have been paid, and download your official 80G tax-exempt e-receipt bills anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPortalData}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 1
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Total Lifetime Contribution */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Contributed (All-Time)</span>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              {currencySymbol} {summary.totalContributed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
              ✓ Verified across all account heads
            </div>
          </div>

          {/* Card 2: Current Year Contribution */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Year {summary.currentYear} Donations</span>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px', borderRadius: '8px' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#003366' }}>
              {currencySymbol} {summary.yearContributed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11.5px', color: '#2563eb', marginTop: '6px', fontWeight: 600 }}>
              Financial Year 2026-27
            </div>
          </div>

          {/* Card 3: Months Supported Tracker */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Months Contributed</span>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              {summary.monthsPaidCount} <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>/ 12 Months</span>
            </div>
            <div style={{
              width: '100%',
              background: '#e2e8f0',
              height: '6px',
              borderRadius: '3px',
              marginTop: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, (summary.monthsPaidCount / 12) * 100)}%`,
                background: '#059669',
                height: '100%'
              }} />
            </div>
          </div>

          {/* Card 4: Official e-Receipts */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Official e-Receipts</span>
              <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '6px', borderRadius: '8px' }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              {summary.totalReceipts} <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>Bills Issued</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#9333ea', marginTop: '6px', fontWeight: 600 }}>
              Available for 1-click download
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'tracker' ? 700 : 500,
              color: activeTab === 'tracker' ? '#003366' : '#64748b',
              background: activeTab === 'tracker' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tracker' ? '2.5px solid #003366' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={16} />
            <span>Monthly Payment Tracker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'bills' ? 700 : 500,
              color: activeTab === 'bills' ? '#003366' : '#64748b',
              background: activeTab === 'bills' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'bills' ? '2.5px solid #003366' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} />
            <span>All Receipts & Bills ({receipts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              color: activeTab === 'profile' ? '#003366' : '#64748b',
              background: activeTab === 'profile' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2.5px solid #003366' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <User size={16} />
            <span>Personal Profile</span>
          </button>
        </div>

        {/* 1. MONTHLY PAYMENT TRACKER ("see which months they had paid and how much they paid") */}
        {activeTab === 'tracker' && (
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                    Calendar Year {summary.currentYear} Monthly Contribution Status
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Clear breakdown of which months you have paid and the amount contributed for each month.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', fontWeight: 600, marginRight: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} /> Paid
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} /> Not Paid
                  </span>
                </div>
              </div>

              {/* 12 Months Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px'
              }}>
                {monthlyBreakdown.map((item) => (
                  <div
                    key={item.month}
                    style={{
                      border: item.isPaid ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                      background: item.isPaid ? '#f0fdf4' : '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px',
                      boxShadow: item.isPaid ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: item.isPaid ? '#065f46' : '#334155' }}>
                          {item.month} {item.year}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: item.isPaid ? '#10b981' : '#f1f5f9',
                          color: item.isPaid ? '#ffffff' : '#64748b'
                        }}>
                          {item.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </div>

                      <div style={{ fontSize: '20px', fontWeight: 800, color: item.isPaid ? '#047857' : '#94a3b8', marginBottom: '6px' }}>
                        {currencySymbol} {item.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>

                      {item.isPaid ? (
                        <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 500 }}>
                          ✓ {item.receiptCount} {item.receiptCount > 1 ? 'Receipts' : 'Receipt'} recorded
                        </div>
                      ) : (
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          No contribution recorded yet
                        </div>
                      )}
                    </div>

                    {item.isPaid && item.receipts.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #d1fae5', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => downloadPdf(item.receipts[0])}
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            border: '1px solid #10b981',
                            color: '#047857',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={13} />
                          <span>Download Bill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const fullR = receipts.find(r => r.id === item.receipts[0].id);
                            if (fullR) onViewReceipt(fullR);
                          }}
                          style={{
                            background: '#047857',
                            border: 'none',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View Bill Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. ALL RECEIPTS & BILLS ("download their bill from that") */}
        {activeTab === 'bills' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                  Official 80G e-Receipts & Payment Bills
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Click "Download PDF" on any receipt to save your official high-resolution printable bill.
                </p>
              </div>
            </div>

            {receipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <FileText size={42} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>No receipts generated yet</div>
                <p style={{ fontSize: '13px', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                  Once the Trust Administrator generates your monthly contribution receipt, it will appear here for instant download.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Receipt No</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Date & Time</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Purpose / Account Head</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Amount</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Payment Mode</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Download & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => {
                      const formattedDate = new Date(r.receipt_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '14px', fontWeight: 700, color: '#003366' }}>
                            {r.receipt_number}
                          </td>
                          <td style={{ padding: '14px', color: '#334155' }}>
                            <div>{formattedDate}</div>
                            {r.receipt_time && (
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{r.receipt_time}</div>
                            )}
                          </td>
                          <td style={{ padding: '14px', color: '#334155' }}>
                            <span style={{
                              background: '#f1f5f9',
                              color: '#1e293b',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}>
                              {r.head_name}
                            </span>
                          </td>
                          <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                            {currencySymbol} {parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '14px', color: '#475569' }}>
                            <div>{r.payment_mode}</div>
                            {r.cheque_or_tx_ref && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                Ref: {r.cheque_or_tx_ref}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => downloadPdf(r)}
                                style={{
                                  background: 'linear-gradient(135deg, #003366 0%, #1e40af 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(0, 51, 102, 0.2)'
                                }}
                                title="Download Official PDF Bill"
                              >
                                <Download size={13} />
                                <span>Download Bill</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onViewReceipt(r)}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #cbd5e1',
                                  color: '#334155',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="View e-Receipt in Browser"
                              >
                                <Eye size={13} />
                                <span>Preview</span>
                              </button>

                              {onShareWhatsApp && (
                                <button
                                  type="button"
                                  onClick={() => onShareWhatsApp(r)}
                                  style={{
                                    background: '#25D366',
                                    border: 'none',
                                    color: '#ffffff',
                                    padding: '7px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Share on WhatsApp"
                                >
                                  <Share2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. PERSONAL INFORMATION PROFILE */}
        {activeTab === 'profile' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            maxWidth: '640px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
              Member Information On File
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px 0' }}>
              These personal details are recorded with the trust and automatically used when generating official 80G tax-exempt receipts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <User size={18} style={{ color: '#003366' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>FULL LEGAL NAME</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user?.full_name}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <Mail size={18} style={{ color: '#003366' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REGISTERED EMAIL (OPTIONAL)</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{user?.email || 'Not provided (Optional)'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <Phone size={18} style={{ color: '#003366' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MOBILE PHONE / WHATSAPP</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{user?.phone || 'Not specified'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <CreditCard size={18} style={{ color: '#003366' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PAN CARD / IDENTIFICATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                    {user?.pan_or_id || 'Not provided (Optional for 80G under ₹2,000)'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={18} style={{ color: '#003366', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>RESIDENTIAL / POSTAL ADDRESS</div>
                  <div style={{ fontSize: '13.5px', color: '#0f172a', lineHeight: 1.5 }}>
                    {user?.address || 'No address provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
