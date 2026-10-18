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

  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
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
    const trustName = settings?.trust_name || 'Charitable Trust';
    const formattedAmount = `${settings?.currency_symbol || '₹'} ${parseFloat(receipt.amount).toLocaleString('en-IN')}`;
    const formattedDate = new Date(receipt.receipt_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const pdfUrl = `${API_BASE}/receipts/${receipt.id}/pdf`;

    const messageLines = [
      `🙏 *Namaste ${receipt.donor_name}*,`,
      ``,
      `On behalf of *${trustName}*, we gratefully acknowledge the receipt of your contribution:`,
      `📄 *Receipt No:* ${receipt.receipt_number}`,
      `📅 *Date:* ${formattedDate}`,
      `💰 *Amount:* ${formattedAmount}`,
      `💳 *Payment Mode:* ${receipt.payment_mode} ${receipt.cheque_or_tx_ref ? `(${receipt.cheque_or_tx_ref})` : ''}`,
      ``,
      `📥 *Download Official e-Receipt PDF:*`,
      `${pdfUrl}`,
      ``,
      `Thank you for your generosity and continuous support.`,
      `Warm regards,`,
      `*${trustName}*`,
    ];

    const encodedText = encodeURIComponent(messageLines.join('\n'));
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

  return (
    <div className="app-container">
      {/* Toast Notification */}
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

      {/* Main Sidebar (Desktop Pinned + Mobile Slide-out Drawer) */}
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

      {/* Modern Touch-Optimized Mobile Bottom Navigation Bar */}
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

        {/* Center Prominent Floating Action Trigger */}
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
