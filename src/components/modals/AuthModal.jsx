import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconShield,
  IconUsers,
  IconCheckCircle,
  IconAlertCircle
} from '../icons/Icons.jsx';

export const AuthModal = () => {
  const { 
    authModalOpen, 
    closeAuthModal, 
    authMode, 
    openAuthModal, 
    handleSignIn, 
    handleSignUp 
  } = useApp();

  const [mode, setMode] = useState(authMode || 'SIGNIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('UG_STUDENT');
  const [designation, setDesignation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authModalOpen) return null;

  const quickAccounts = [
    { label: 'HOD', name: 'Dr. Sen', email: 'hod.it@university.edu', pass: 'Admin@123', role: 'HOD' },
    { label: 'Coord', name: 'Dr. Roy', email: 'ananya.roy@university.edu', pass: 'Coord@123', role: 'COORDINATOR' },
    { label: 'Guide', name: 'Dr. Das', email: 'vikram.das@university.edu', pass: 'Guide@123', role: 'FACULTY' },
    { label: 'PG', name: 'Sneha M.', email: 'sneha.m@university.edu', pass: 'Student@123', role: 'PG_STUDENT' },
    { label: 'UG', name: 'Team 04', email: 'team04.lead@university.edu', pass: 'Student@123', role: 'UG_STUDENT' }
  ];

  const handleFillQuick = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'SIGNIN') {
        await handleSignIn({ email, password });
      } else {
        await handleSignUp({
          name,
          email,
          password,
          role,
          designation: designation || (role.includes('STUDENT') ? 'Student Scholar' : 'Faculty Member')
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <IconShield size={16} className="text-indigo" />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Academic RBAC Portal
              </span>
            </div>
            <h2>{mode === 'SIGNIN' ? 'Sign In to DeptFlow 360' : 'Create New User Account'}</h2>
          </div>
          <button className="modal-close" onClick={closeAuthModal}>&times;</button>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ padding: '0.85rem 1.5rem 0', background: '#ffffff' }}>
          <div className="persona-switcher-track" style={{ width: '100%', justifyContent: 'center' }}>
            <button
              type="button"
              className={`persona-segment-btn ${mode === 'SIGNIN' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setMode('SIGNIN'); setErrorMsg(''); }}
            >
              Sign In (Existing User)
            </button>
            <button
              type="button"
              className={`persona-segment-btn ${mode === 'SIGNUP' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setMode('SIGNUP'); setErrorMsg(''); }}
            >
              Sign Up (New User)
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body" style={{ gap: '1rem' }}>
            {errorMsg && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconAlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Fill Pills for Evaluation in Sign In */}
            {mode === 'SIGNIN' && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '0.25rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Quick Pre-Set Evaluation Logins
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {quickAccounts.map(acc => (
                    <button
                      key={acc.label}
                      type="button"
                      className="filter-pill"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      onClick={() => handleFillQuick(acc)}
                      title={`Fill ${acc.name} (${acc.role})`}
                    >
                      <strong>{acc.label}:</strong> {acc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Up Fields */}
            {mode === 'SIGNUP' && (
              <>
                <div className="form-group">
                  <label>Full Legal Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Ramesh Gupta or Ananya Sen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Academic Role Classification:</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => {
                      const r = e.target.value;
                      setRole(r);
                      if (r === 'HOD') setDesignation('Professor & Head of Department');
                      else if (r === 'COORDINATOR') setDesignation('Associate Professor (Coordinator)');
                      else if (r === 'FACULTY') setDesignation('Associate Professor');
                      else if (r === 'PG_STUDENT') setDesignation('PG Scholar (M.Tech)');
                      else setDesignation('UG Capstone Lead (B.Tech)');
                    }}
                  >
                    <option value="UG_STUDENT">UG Student (B.Tech Capstone)</option>
                    <option value="PG_STUDENT">PG Student (M.Tech Dissertation)</option>
                    <option value="FACULTY">Faculty Member / Supervisor</option>
                    <option value="COORDINATOR">Project Coordinator</option>
                    <option value="HOD">Head of Department (HOD)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation / Title:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Associate Professor or B.Tech Team 04 Lead"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label>Institutional Email Address:</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password (Encrypted & Hashed):</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter minimum 6 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                🔒 Passwords are cryptographically salted and hashed before persistence.
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMode(mode === 'SIGNIN' ? 'SIGNUP' : 'SIGNIN');
                setErrorMsg('');
              }}
            >
              {mode === 'SIGNIN' ? 'Need an account? Sign Up' : 'Already have account? Sign In'}
            </button>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeAuthModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                id="btnAuthSubmit"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : mode === 'SIGNIN' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
