import React, { useState, useEffect, useRef } from 'react';
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

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Guarantee modal input boxes start completely clean and prevent browser autofill
  useEffect(() => {
    if (authModalOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setDesignation('');
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';

      const timer = setTimeout(() => {
        if (emailInputRef.current) emailInputRef.current.value = '';
        if (passwordInputRef.current) passwordInputRef.current.value = '';
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [authModalOpen, mode]);

  if (!authModalOpen) return null;

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
              onClick={() => { 
                setMode('SIGNIN'); 
                setErrorMsg('');
                setEmail('');
                setPassword('');
              }}
            >
              Sign In (Existing User)
            </button>
            <button
              type="button"
              className={`persona-segment-btn ${mode === 'SIGNUP' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { 
                setMode('SIGNUP'); 
                setErrorMsg('');
                setEmail('');
                setPassword('');
                setName('');
                setDesignation('');
              }}
            >
              Sign Up (New User)
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} autoComplete="off" data-lpignore="true" data-form-type="other">
          {/* Decoy fields to thwart browser password autofill */}
          <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
            <input type="text" name="fake_username_prevent_autofill_modal" tabIndex="-1" autoComplete="off" defaultValue="" />
            <input type="password" name="fake_password_prevent_autofill_modal" tabIndex="-1" autoComplete="new-password" defaultValue="" />
          </div>

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

            {/* Sign Up Fields */}
            {mode === 'SIGNUP' && (
              <>
                <div className="form-group">
                  <label>Full Legal Name:</label>
                  <input
                    type="text"
                    name="modal_signup_legal_name"
                    className="form-control"
                    placeholder="e.g. Dr. Ramesh Gupta or Ananya Sen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Academic Role Classification:</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
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
                    name="modal_signup_designation"
                    className="form-control"
                    placeholder="e.g. Associate Professor or B.Tech Team 04 Lead"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label>Institutional Email Address:</label>
              <input
                ref={emailInputRef}
                type="email"
                name="modal_user_auth_email"
                className="form-control"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
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
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                name="modal_user_auth_password"
                className="form-control"
                placeholder="Enter minimum 6 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
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
