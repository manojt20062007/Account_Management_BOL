import React, { useState } from 'react';
import { FolderTree, Plus, CheckCircle, Tag } from 'lucide-react';

export default function HeadsView({ heads, onAddHead }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHead, setNewHead] = useState({ name: '', code: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newHead.name.trim()) return;
    await onAddHead(newHead);
    setShowAddModal(false);
    setNewHead({ name: '', code: '', description: '' });
  };

  return (
    <div className="view-body">
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#0f172a' }}>Trust Account Heads & Fund Categories</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Designate where contributions are credited for accounting & 80G tax reporting</div>
        </div>
        <button className="btn btn-emerald" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Add Account Head</span>
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category / Head Name</th>
                <th>Internal Code</th>
                <th>Description & Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {heads.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{h.name}</td>
                  <td>
                    <span className="receipt-num-badge">{h.code}</span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#475569' }}>{h.description || 'General Trust allocation'}</td>
                  <td>
                    <span className="status-badge sent">
                      <CheckCircle size={10} />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create Account Head</div>
              <button className="btn btn-outline btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Head / Category Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Rural Healthcare & Ambulance Fund"
                    value={newHead.name}
                    onChange={(e) => setNewHead({ ...newHead, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ledger Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. HEALTH_AMB"
                    value={newHead.code}
                    onChange={(e) => setNewHead({ ...newHead, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Purpose / Description</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Accounting purpose or 80G eligibility details"
                    value={newHead.description}
                    onChange={(e) => setNewHead({ ...newHead, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-emerald">Create Head</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
