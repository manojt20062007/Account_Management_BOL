import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, Phone, MapPin, CreditCard, Eye, EyeOff, ArrowRight, UserPlus, LogIn, HeartHandshake } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function AuthView({ onAuthSuccess, settings }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sign In State (Phone number is primary, email also supported)
  const [signInData, setSignInData] = useState({
    identifier: '',
    password: '',
  });

  // Sign Up State (Personal Information - Mobile phone primary, email optional)
  const [signUpData, setSignUpData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    pan_or_id: '',
  });

  const trustName = settings?.trust_name || 'BRIDGE OF LOVE';
  const tagline = settings?.tagline || 'Dedicated to Social Upliftment, Education & Healthcare';

  // Handle Member Login using Phone Number or Email
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signInData.identifier.trim(),
          email: signInData.identifier.trim(),
          phone: signInData.identifier.trim(),
          password: signInData.password,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to sign in');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Normal Sign Up (No OTP, saves personal info & immediately signs in)
  const handleSignUp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    if (!signUpData.full_name.trim()) {
      setError('Please provide your full legal name');
      setLoading(false);
      return;
    }
    if (!signUpData.phone.trim()) {
      setError('Please provide your mobile phone number (used to login)');
      setLoading(false);
      return;
    }
    if (!signUpData.password || signUpData.password.length < 4) {
      setError('Password must be at least 4 characters long');
      setLoading(false);
      return;
    }
    if (signUpData.email && signUpData.email.trim() && !signUpData.email.includes('@')) {
      setError('Please provide a valid email address or leave it blank');
      setLoading(false);
      return;
    }
    if (!signUpData.address.trim()) {
      setError('Please provide your residential / postal address for official records');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setSuccessMsg('Account registered successfully! Logging you in...');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Auto-filler for member
  const fillDemoMember = () => {
    setSignInData({
      identifier: '9448123456',
      password: 'member123',
    });
    setTab('signin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b192c 0%, #1e3a8a 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
    }}>
      {/* Background Decorative Blur Orbs */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(0,0,0,0) 70%)',
        top: '10%',
        left: '15%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%',
        right: '15%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header with Mother Teresa & Logo */}
        <div style={{
          background: 'linear-gradient(135deg, #002244 0%, #003366 100%)',
          color: '#ffffff',
          padding: '28px 24px 22px 24px',
          textAlign: 'center',
          position: 'relative',
          borderBottom: '3px solid #d97706'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '12px' }}>
            {/* Trust Logo */}
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Mother Teresa Cameo Oval */}
            <div style={{
              width: '56px',
              height: '68px',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
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

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fde68a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            அன்பின் பாலம் • OFFICIAL PORTAL
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
            {trustName}
          </h1>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, opacity: 0.9 }}>
            Member Contribution & e-Receipt Management System
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            style={{
              flex: 1,
              padding: '13px 8px',
              fontSize: '13.5px',
              fontWeight: tab === 'signin' ? 700 : 600,
              color: tab === 'signin' ? '#003366' : '#64748b',
              background: tab === 'signin' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: tab === 'signin' ? '2.5px solid #003366' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} />
            <span>Member Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '13px 8px',
              fontSize: '13.5px',
              fontWeight: tab === 'signup' ? 700 : 600,
              color: tab === 'signup' ? '#003366' : '#64748b',
              background: tab === 'signup' ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: tab === 'signup' ? '2.5px solid #003366' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} />
            <span>Member Sign Up</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. MEMBER SIGN IN FORM */}
          {tab === 'signin' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mobile Phone Number (or Email)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210 (or member@example.com)"
                    value={signInData.identifier}
                    onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
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
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  📱 Sign in easily using your registered 10-digit mobile phone number.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
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
                  boxShadow: '0 4px 12px rgba(0, 51, 102, 0.25)',
                  marginBottom: '16px'
                }}
              >
                {loading ? 'Signing In...' : 'Sign In to Member Portal'}
                <ArrowRight size={16} />
              </button>

              {/* Quick Testing Helper */}
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <span>Need quick testing?</span>
                <button
                  type="button"
                  onClick={fillDemoMember}
                  style={{
                    background: '#e0e7ff',
                    color: '#3730a3',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Fill Demo Member
                </button>
              </div>
            </form>
          )}

          {/* 2. NEW MEMBER SIGN UP (NO OTP - INSTANT REGISTRATION) */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#166534',
                marginBottom: '16px',
                lineHeight: 1.4
              }}>
                <strong>⚡ Instant Access:</strong> No OTP verification needed. Enter your personal details to create your account and access all your payment history and bills immediately.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajeshwari Sundaram"
                    value={signUpData.full_name}
                    onChange={(e) => setSignUpData({ ...signUpData, full_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Mobile Phone / WhatsApp <span style={{ color: '#ef4444' }}>* (Login ID)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value, whatsapp: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#059669', display: 'block', marginTop: '2px' }}>
                    ✓ Used to log into your account
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 4 characters"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Email Address <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. name@email.com (Optional)"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    Optional: for receiving PDF receipt
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    value={signUpData.pan_or_id}
                    onChange={(e) => setSignUpData({ ...signUpData, pan_or_id: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Full Residential Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Door No, Street, Area, City, Pincode, State"
                    value={signUpData.address}
                    onChange={(e) => setSignUpData({ ...signUpData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up & Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '14px 20px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: '#64748b'
        }}>
          Bridge of Love Charitable Trust • Reg. No. TR/BK-IV/452/2012 • 80G Certified
        </div>
      </div>
    </div>
  );
}
