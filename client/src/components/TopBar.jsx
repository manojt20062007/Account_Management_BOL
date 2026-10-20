import React from 'react';
import { PlusCircle, FileDown, Calendar, Menu } from 'lucide-react';

export default function TopBar({
  onOpenNewReceipt,
  onExportAllPdf,
  settings,
  activeTab,
  onToggleMobileMenu,
  currentUser,
  onLogout,
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const titles = {
    dashboard: 'Trust Financial Overview',
    receipts: 'Daybook & Receipts Management',
    donors: 'Trust Members & Ledger',
    settings: 'Trust Configuration & SMTP',
  };

  // Dynamically extract city/region from address or default
  const getLocation = () => {
    if (!settings?.address) return 'Tiruttani, Tamilnadu';
    const parts = settings.address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join(', ');
    }
    return settings.address;
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {/* Hamburger Menu button on Mobile & Tablet */}
        <button
          type="button"
          className="top-bar-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="top-bar-title-wrap">
          <h1>{titles[activeTab] || 'Trust Accounting'}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img src="/hands_heart.png" alt="" style={{ height: '14px', width: 'auto', objectFit: 'contain' }} />
            <span>{settings?.trust_name || 'Anbin Unavu'}</span>
            <img src="/hands_heart.png" alt="" style={{ height: '14px', width: 'auto', objectFit: 'contain' }} />
            <span>• {getLocation()}</span>
          </p>
        </div>
      </div>

      <div className="top-bar-actions">
        <div className="top-bar-date">
          <Calendar size={13} />
          <span>{currentDate}</span>
        </div>

        {/* ONE CLICK PDF BUTTON FOR ALL ACCOUNTS */}
        <button
          className="btn btn-one-click-pdf btn-topbar-action"
          onClick={onExportAllPdf}
          id="btn-export-all-accounts-pdf"
          title="Export audited consolidated PDF statement of all accounts"
        >
          <FileDown size={14} />
          <span className="btn-text-desktop">Export All Accounts PDF</span>
          <span className="btn-text-mobile">All PDF</span>
        </button>

        {/* NEW RECEIPT / BILL GENERATION BUTTON */}
        <button
          className="btn btn-emerald btn-topbar-action"
          onClick={onOpenNewReceipt}
          id="btn-new-receipt-trigger"
        >
          <PlusCircle size={14} />
          <span className="btn-text-desktop">Issue Member Receipt</span>
          <span className="btn-text-mobile">+ Receipt</span>
        </button>

        {/* User Account / Admin Badge & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
            <div style={{
              background: '#f1f5f9',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}>
              <span style={{
                background: currentUser.role === 'admin' ? '#d97706' : '#003366',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {currentUser.role || 'User'}
              </span>
              <span style={{ fontWeight: 600, color: '#334155', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.full_name}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
                title="Sign out of current account"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
