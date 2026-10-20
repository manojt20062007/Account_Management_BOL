import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Users, Settings, Plus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import ReceiptsView from './components/ReceiptsView';
import DonorsView from './components/DonorsView';
import HeadsView from './components/HeadsView';
import SettingsView from './components/SettingsView';
import NewReceiptModal from './components/NewReceiptModal';
import ViewReceiptModal from './components/ViewReceiptModal';
import AuthView from './components/AuthView';
import DonorPortalView from './components/DonorPortalView';
import AdminLoginView from './components/AdminLoginView';

import { API_BASE } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [heads, setHeads] = useState([]);
  const [donors, setDonors] = useState([]);
  const [settings, setSettings] = useState(null);
  const [liveSettings, setLiveSettings] = useState(null);
  const activeSettings = liveSettings || settings;
  const [filterState, setFilterState] = useState({ search: '', head_id: '', payment_mode: '' });

  // URL-based Navigation State (/admin vs /)
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setCurrentHash(window.location.hash);
  };

  const isAdminRoute = currentPath.startsWith('/admin') || currentHash === '#admin';

  // User Authentication & Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bol_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('bol_auth_token') || null;
  });

  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('bol_auth_user', JSON.stringify(user));
    localStorage.setItem('bol_auth_token', token);
    showToast(`Welcome ${user.full_name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('bol_auth_user');
    localStorage.removeItem('bol_auth_token');
    showToast('Signed out successfully', 'info');
  };

  // 1. Initial Load of Data
  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const loadReceipts = async (filters = filterState) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.head_id) params.append('head_id', filters.head_id);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);

      const res = await fetch(`${API_BASE}/receipts?${params.toString()}`);
      const data = await res.json();
      if (data.success) setReceipts(data.data);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    }
  };

  const loadHeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/heads`);
      const data = await res.json();
      if (data.success) setHeads(data.data);
    } catch (err) {
      console.error('Failed to load heads:', err);
    }
  };

  const loadDonors = async () => {
    try {
      const res = await fetch(`${API_BASE}/donors`);
      const data = await res.json();
      if (data.success) setDonors(data.data);
    } catch (err) {
      console.error('Failed to load donors:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    loadDashboard();
    loadReceipts();
    loadHeads();
    loadDonors();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilterState(newFilters);
    loadReceipts(newFilters);
  };

  // 2. ONE-CLICK PDF GENERATION FOR ALL ACCOUNTS
  const handleExportAllPdf = () => {
    showToast('Generating official All Accounts PDF statement...', 'info');
    const url = `${API_BASE}/receipts/export/all-pdf`;
    window.open(url, '_blank');
  };

  // 3. Create New Receipt
  const handleCreateReceipt = async (receiptPayload) => {
    const res = await fetch(`${API_BASE}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptPayload),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate receipt');
    }

    showToast(`Receipt ${result.data.receipt_number} issued successfully!`, 'success');
    loadDashboard();
    loadReceipts();
    loadDonors();
    return result.data;
  };

  // 4. MANUAL WHATSAPP SHARING
  const handleShareWhatsApp = (receipt) => {
    const trustName = settings?.trust_name || 'Anbin Unavu';
    const formattedAmount = `${settings?.currency_symbol || '₹'} ${parseFloat(receipt.amount || 0).toLocaleString('en-IN')}`;
    let formattedDate = '';
    if (receipt.receipt_date) {
      try {
        formattedDate = new Date(receipt.receipt_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch (e) {
        formattedDate = String(receipt.receipt_date);
      }
    }

    const pdfUrl = `${API_BASE}/receipts/${receipt.id}/pdf`;
    const paymentModeStr = `${receipt.payment_mode || 'Cash'}${receipt.cheque_or_tx_ref ? ` (${receipt.cheque_or_tx_ref})` : ''}`;

    let template = settings?.whatsapp_message;
    if (!template || !template.trim()) {
      template = `🙏 *Namaste {donor_name}*,

On behalf of *{trust_name}*, we gratefully acknowledge the receipt of your contribution:
📄 *Receipt No:* {receipt_no}
📅 *Date:* {date}
💰 *Amount:* {amount}
💳 *Payment Mode:* {payment_mode}

📥 *Download Official e-Receipt PDF:*
{pdf_url}

Thank you for your generosity and continuous support.
Warm regards,
*{trust_name}*`;
    }

    const finalMessage = template
      .replace(/{donor_name}/g, receipt.donor_name || 'Valued Member / Donor')
      .replace(/{trust_name}/g, trustName)
      .replace(/{receipt_no}/g, receipt.receipt_number || '')
      .replace(/{date}/g, formattedDate)
      .replace(/{amount}/g, formattedAmount)
      .replace(/{payment_mode}/g, paymentModeStr)
      .replace(/{pdf_url}/g, pdfUrl);

    const encodedText = encodeURIComponent(finalMessage);
    let rawPhone = receipt.donor_whatsapp || receipt.donor_phone || '';
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    // If Indian 10-digit number without country code, prepend 91
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    let whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  // 5. Resend Email via SMTP
  const handleResendEmail = async (receipt) => {
    try {
      showToast(`Dispatching receipt email to ${receipt.donor_email} via SMTP...`, 'info');
      const res = await fetch(`${API_BASE}/receipts/${receipt.id}/send-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Email dispatched to ${receipt.donor_email}`, 'success');
        loadReceipts();
      } else {
        showToast(`Email dispatch failed: ${data.message}`, 'error');
      }
    } catch (err) {
      showToast(`Error resending email: ${err.message}`, 'error');
    }
  };

  // 6. Save Settings
  const handleSaveSettings = async (newSettings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setSettings(data.data);
    showToast('Trust profile and SMTP settings saved', 'success');
  };

  const handleVerifySmtp = async (smtpConfig) => {
    const res = await fetch(`${API_BASE}/settings/verify-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  };

  // 7. Add Donor
  const handleAddDonor = async (donor) => {
    const res = await fetch(`${API_BASE}/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donor),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast(`Donor ${data.data.full_name} added`, 'success');
    loadDonors();
  };

  // 8. Add Head
  const handleAddHead = async (head) => {
    const res = await fetch(`${API_BASE}/heads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(head),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    showToast(`Account head ${data.data.name} created`, 'success');
    loadHeads();
  };

  // =========================================================================
  // ROUTE 1: ADMIN ROUTE (/admin or /#admin)
  // Strictly for Trust Administration. In URL /admin it goes to Admin Login Page
  // =========================================================================
  if (isAdminRoute) {
    // If not logged in as Admin, show dedicated Admin Login View
    if (!currentUser || currentUser.role !== 'admin') {
      return (
        <>
          {toastMessage && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 200,
              background: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {toastMessage.msg}
            </div>
          )}
          <AdminLoginView
            onAuthSuccess={(user, token) => {
              handleAuthSuccess(user, token);
              navigateTo('/admin');
            }}
            settings={activeSettings}
            onGoToMemberPortal={() => navigateTo('/')}
          />
        </>
      );
    }

    // Admin is logged in and visiting /admin: Render full Admin Dashboard
    return (
      <div className="app-container">
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 200,
            background: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {toastMessage.msg}
          </div>
        )}

        {/* Main Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onExportAllPdf={handleExportAllPdf}
          stats={stats}
          settings={activeSettings}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Workspace */}
        <div className="app-main">
          <TopBar
            activeTab={activeTab}
            settings={activeSettings}
            onOpenNewReceipt={() => setIsNewReceiptOpen(true)}
            onExportAllPdf={handleExportAllPdf}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            currentUser={currentUser}
            onLogout={() => {
              handleLogout();
              navigateTo('/admin');
            }}
          />

          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              settings={activeSettings}
              onOpenNewReceipt={() => setIsNewReceiptOpen(true)}
              onExportAllPdf={handleExportAllPdf}
              onViewReceipt={(r) => setViewingReceipt(r)}
              onShareWhatsApp={handleShareWhatsApp}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsView
              receipts={receipts}
              heads={heads}
              settings={activeSettings}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onOpenNewReceipt={() => setIsNewReceiptOpen(true)}
              onExportAllPdf={handleExportAllPdf}
              onViewReceipt={(r) => setViewingReceipt(r)}
              onShareWhatsApp={handleShareWhatsApp}
              onResendEmail={handleResendEmail}
            />
          )}

          {activeTab === 'donors' && (
            <DonorsView
              donors={donors}
              settings={activeSettings}
              onAddDonor={handleAddDonor}
            />
          )}

          {activeTab === 'heads' && (
            <HeadsView
              heads={heads}
              onAddHead={handleAddHead}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={async (updatedSettings) => {
                await handleSaveSettings(updatedSettings);
                setLiveSettings(null);
              }}
              onLiveChange={(previewData) => setLiveSettings(previewData)}
              onVerifySmtp={handleVerifySmtp}
            />
          )}
        </div>

        {/* Issue New Receipt Modal */}
        <NewReceiptModal
          isOpen={isNewReceiptOpen}
          onClose={() => setIsNewReceiptOpen(false)}
          onSubmit={handleCreateReceipt}
          heads={heads}
          donors={donors}
          settings={activeSettings}
        />

        {/* Printable Receipt Preview Modal */}
        <ViewReceiptModal
          isOpen={Boolean(viewingReceipt)}
          receipt={viewingReceipt}
          settings={activeSettings}
          onClose={() => setViewingReceipt(null)}
          onShareWhatsApp={handleShareWhatsApp}
        />

        {/* Mobile Navigation */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('receipts'); setIsMobileMenuOpen(false); }}
          >
            <Receipt size={20} />
            <span>Daybook</span>
            {stats?.totalReceipts > 0 && (
              <span className="mobile-nav-badge">{stats.totalReceipts}</span>
            )}
          </button>

          <button
            type="button"
            className="mobile-nav-fab"
            onClick={() => { setIsNewReceiptOpen(true); setIsMobileMenuOpen(false); }}
            title="Issue New Member Receipt"
          >
            <Plus size={24} />
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => { setActiveTab('donors'); setIsMobileMenuOpen(false); }}
          >
            <Users size={20} />
            <span>Members</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    );
  }

  // =========================================================================
  // ROUTE 2: PUBLIC MEMBER ROUTE (URL /)
  // Strictly for Members / Donors. ZERO Admin partiality, no admin tabs visible!
  // =========================================================================

  // If not logged in -> Show Member AuthView (only Member Sign In & Sign Up)
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 200,
            background: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {toastMessage.msg}
          </div>
        )}
        <AuthView onAuthSuccess={handleAuthSuccess} settings={activeSettings} />
      </>
    );
  }

  // If logged in as Member / Donor -> Show DonorPortalView
  if (currentUser.role === 'donor') {
    return (
      <>
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 200,
            background: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {toastMessage.msg}
          </div>
        )}

        <DonorPortalView
          user={currentUser}
          token={authToken}
          settings={activeSettings}
          onLogout={handleLogout}
          onViewReceipt={(r) => setViewingReceipt(r)}
          onShareWhatsApp={handleShareWhatsApp}
        />

        <ViewReceiptModal
          isOpen={Boolean(viewingReceipt)}
          receipt={viewingReceipt}
          settings={activeSettings}
          onClose={() => setViewingReceipt(null)}
          onShareWhatsApp={handleShareWhatsApp}
        />
      </>
    );
  }

  // If logged in as Admin and on root URL -> Redirect or offer button to open /admin
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        maxWidth: '440px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginBottom: '6px' }}>
          Administrator Session Active
        </div>
        <h2 style={{ color: '#003366', margin: '0 0 8px 0', fontSize: '20px' }}>
          {currentUser.full_name}
        </h2>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '22px' }}>
          You are currently signed in with administrator privileges.
        </p>
        <button
          onClick={() => navigateTo('/admin')}
          style={{
            background: 'linear-gradient(135deg, #003366 0%, #1e40af 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(0, 51, 102, 0.25)'
          }}
        >
          Open Admin Dashboard (/admin)
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: '#ffffff',
            color: '#64748b',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
