import React, { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, MessageSquare, IndianRupee } from 'lucide-react';

export default function DonorsView({ donors, settings, onAddDonor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDonor, setNewDonor] = useState({
    full_name: '',
    pan_or_id: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    notes: '',
  });

  const currencySymbol = settings?.currency_symbol || '₹';

  const filtered = donors.filter((d) => {
    const s = searchTerm.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(s) ||
      d.pan_or_id?.toLowerCase().includes(s) ||
      d.phone?.includes(s) ||
      d.email?.toLowerCase().includes(s)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDonor.full_name.trim()) return;
    await onAddDonor(newDonor);
    setShowAddModal(false);
    setNewDonor({
      full_name: '',
      pan_or_id: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      notes: '',
    });
  };

  return (
    <div className="view-body">
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '34px', width: '100%' }}
              placeholder="Search members by name, phone, PAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-emerald" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Register Trust Member</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Users size={18} />
            <span>Trust Members Directory</span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>({filtered.length} registered members)</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>PAN / ID</th>
                <th>Contact Info</th>
                <th>WhatsApp No</th>
                <th>Address</th>
                <th style={{ textAlign: 'center' }}>Total Receipts</th>
                <th style={{ textAlign: 'right' }}>Total Contributions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.full_name}</div>
                    </td>
                    <td>
                      {d.pan_or_id ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {d.pan_or_id}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>Not recorded</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {d.phone && <span>Tel: {d.phone}</span>}
                        {d.email && <span style={{ color: '#0284c7' }}>{d.email}</span>}
                      </div>
                    </td>
                    <td>
                      {d.whatsapp || d.phone ? (
                        <a
                          href={`https://wa.me/${(d.whatsapp || d.phone).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Chat on WhatsApp
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: '#475569', maxWidth: '200px', display: 'inline-block' }}>
                        {d.address || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="receipt-num-badge">{d.receipt_count || 0}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {currencySymbol} {parseFloat(d.total_contributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No donors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Donor Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Register New Donor</div>
              <button className="btn btn-outline btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Smt. Gayatri Devi"
                    value={newDonor.full_name}
                    onChange={(e) => setNewDonor({ ...newDonor, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Number (for 80G Tax Exemption)</label>
                  <input
                    type="text"
                    maxLength={10}
                    className="form-control"
                    placeholder="e.g. ABCDE1234F"
                    style={{ textTransform: 'uppercase' }}
                    value={newDonor.pan_or_id}
                    onChange={(e) => setNewDonor({ ...newDonor, pan_or_id: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={newDonor.phone}
                    onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value, whatsapp: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (for SMTP delivery)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="donor@example.com"
                    value={newDonor.email}
                    onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Number (with country code)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="919876543210"
                    value={newDonor.whatsapp}
                    onChange={(e) => setNewDonor({ ...newDonor, whatsapp: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Full Address</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Mailing address for records"
                    value={newDonor.address}
                    onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-emerald">Save Donor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
