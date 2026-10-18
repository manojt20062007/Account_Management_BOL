import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Settings, 
  FileDown,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onExportAllPdf, 
  stats, 
  settings,
  isOpenMobile,
  onCloseMobile 
}) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="trust-logo-box">
            <img 
              src="/logo.png" 
              alt="Bridge of Love" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} 
            />
          </div>
          <div className="brand-info">
            <h2>TrustAccount Pro</h2>
            <span>
              {settings?.trust_name?.length > 22 
                ? settings.trust_name.slice(0, 22) + '...' 
                : (settings?.trust_name || 'Charitable Trust')}
            </span>
          </div>

          {/* Close button for mobile drawer */}
          <button 
            type="button" 
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => handleTabClick('receipts')}
          >
            <Receipt size={18} />
            <span>Daybook & Receipts</span>
            {stats?.totalReceipts > 0 && (
              <span className="nav-badge">{stats.totalReceipts}</span>
            )}
          </button>

          <button
            className={`nav-link ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => handleTabClick('donors')}
          >
            <Users size={18} />
            <span>Trust Members</span>
            {stats?.totalDonors > 0 && (
              <span className="nav-badge">{stats.totalDonors}</span>
            )}
          </button>

          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <Settings size={18} />
            <span>Trust & SMTP Setup</span>
          </button>

          {/* One-Click PDF Action in Sidebar */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              className="btn btn-one-click-pdf"
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => {
                onExportAllPdf();
                if (onCloseMobile) onCloseMobile();
              }}
              title="Download consolidated PDF ledger of all accounts in 1 click"
            >
              <FileDown size={16} />
              <span>All Accounts PDF</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
