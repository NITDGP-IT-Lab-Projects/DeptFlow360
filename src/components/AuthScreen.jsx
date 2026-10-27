import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  IconGraduationCap,
  IconShield,
  IconUsers,
  IconCheckCircle,
  IconAlertCircle,
  IconArrowRight
} from './icons/Icons.jsx';

export const AuthScreen = () => {
  const { handleSignIn, handleSignUp } = useApp();

  const [mode, setMode] = useState('SIGNIN'); // 'SIGNIN' | 'SIGNUP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('UG_STUDENT');
  const [designation, setDesignation] = useState('B.Tech Capstone Scholar');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '2.25rem',
        animation: 'viewEntrance 0.25s var(--ease-spring)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <IconGraduationCap size={26} />
          </div>
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}>
            DeptFlow 360
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Department of Information Technology • NIT Durgapur
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="persona-switcher-track" style={{ width: '100%', marginBottom: '1.5rem', padding: '4px' }}>
          <button
            type="button"
            className={`persona-segment-btn ${mode === 'SIGNIN' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '0.45rem 0.75rem' }}
            onClick={() => { setMode('SIGNIN'); setErrorMsg(''); }}
          >
            Sign In (Existing User)
          </button>
          <button
            type="button"
            className={`persona-segment-btn ${mode === 'SIGNUP' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '0.45rem 0.75rem' }}
            onClick={() => { setMode('SIGNUP'); setErrorMsg(''); }}
          >
            Sign Up (New User)
          </button>
        </div>

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
            gap: '8px',
            marginBottom: '1.25rem'
          }}>
            <IconAlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'SIGNIN' && (
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.85rem',
            marginBottom: '1.25rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconShield size={16} className="text-indigo" />
            <span>Enter your registered institutional credentials to access your dashboard.</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'SIGNUP' && (
              <>
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Ramesh Sen or Ananya Sen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Academic Role:</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => {
                      const r = e.target.value;
                      setRole(r);
                      if (r === 'HOD') setDesignation('Professor & Head of Department');
                      else if (r === 'COORDINATOR') setDesignation('Associate Professor (Coordinator)');
                      else if (r === 'FACULTY') setDesignation('Associate Professor (Faculty Guide)');
                      else if (r === 'PG_STUDENT') setDesignation('PG Scholar (M.Tech)');
                      else setDesignation('B.Tech Capstone Lead');
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
                  <label>Academic Designation / Team Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. B.Tech Team 04 Lead or Assistant Professor"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Institutional Email:</label>
              <input
                type="email"
                className="form-control"
                id="authEmailInput"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password:</label>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.72rem',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600
                  }}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="authPasswordInput"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                🔒 Passwords are cryptographically salted and hashed before persistence.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="btnAuthSubmit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.7rem',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{loading ? 'Verifying...' : mode === 'SIGNIN' ? 'Sign In to Portal' : 'Create & Register Account'}</span>
              <IconArrowRight size={15} />
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => {
              setMode(mode === 'SIGNIN' ? 'SIGNUP' : 'SIGNIN');
              setErrorMsg('');
            }}
          >
            {mode === 'SIGNIN' ? "Don't have an account yet? Register here" : 'Already registered? Sign in with existing credentials'}
          </button>
        </div>
      </div>
    </div>
  );
};
