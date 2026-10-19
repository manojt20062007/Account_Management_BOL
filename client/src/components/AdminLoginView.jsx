import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function AdminLoginView({ onAuthSuccess, settings, onGoToMemberPortal }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
  });

  const trustName = settings?.trust_name || 'BRIDGE OF LOVE';

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to authenticate administrator');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. This login is reserved for Trust Administrators.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setAdminData({
      email: 'admin@bridgeoflove.org',
      password: 'admin123',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1526 0%, #002244 50%, #09111e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
    }}>
      {/* Background Accent Orbs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(0,0,0,0) 70%)',
        top: '15%',
        right: '15%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.55)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #001a33 0%, #002b54 100%)',
          color: '#ffffff',
          padding: '28px 24px 22px 24px',
          textAlign: 'center',
          borderBottom: '3px solid #d97706'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: '52px', height: '52px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Oval Cameo Mother Teresa Portrait */}
            <div style={{
              width: '52px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}>
              <img
                src="/mother.png"
                alt="Mother Teresa"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(217, 119, 6, 0.2)',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            color: '#fef3c7',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            <ShieldCheck size={13} style={{ color: '#fbbf24' }} />
            <span>Admin Control Portal</span>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
            {trustName}
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Restricted Access: Receipts, Daybook & Trust Settings
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Admin Email Address or Mobile Phone
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@bridgeoflove.org or 9444100000"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #003366 0%, #1e40af 100%)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 51, 102, 0.3)',
                marginBottom: '16px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Helper */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              padding: '10px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '18px'
            }}>
              <span>Need testing access?</span>
              <button
                type="button"
                onClick={fillDemoAdmin}
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ⚡ Fill Demo Admin
              </button>
            </div>

            {/* Link back to public member portal */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={onGoToMemberPortal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#003366',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Member Portal</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: '#64748b'
        }}>
          Authorized Personnel Only • Bridge of Love System Administration
        </div>
      </div>
    </div>
  );
}
