import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export const Topbar = () => {
  const { 
    activeView, 
    currentRoleKey, 
    setCurrentRoleKey, 
    currentRoleData, 
    openModal, 
    notifications, 
    markAllNotificationsRead,
    handleExportAudit,
    handleResetEntirePortal
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const viewHeaders = {
    dashboard: {
      title: "Departmental Operations & Workflow Overview",
      subtitle: "Information Technology Department • Academic Year 2026-27"
    },
    approvals: {
      title: "Multi-Tier Approvals & Workflow Inbox",
      subtitle: "Review, endorse and sanction academic submissions with RBAC authority"
    },
    allocation: {
      title: "Project Allocation & Quota Management",
      subtitle: "Gale-Shapley stable matching algorithm with merit weightage & quota constraints"
    },
    ugpg_desk: {
      title: "UG & PG Activity & Submissions Desk",
      subtitle: "Track proposal progress, milestone submissions, and continuous outcomes"
    },
    rubric_eval: {
      title: "Defense Station & Assessment Rubrics",
      subtitle: "ABET / NBA outcome-based continuous assessment scoring vectors"
    },
    faculty_dir: {
      title: "Faculty Directory & Supervisory Capacities",
      subtitle: "Departmental faculty quotas, current student rosters, and research areas"
    },
    architecture: {
      title: "System Architecture & Interface Design",
      subtitle: "Finite state machine specifications, RBAC matrix, and software contracts"
    }
  };

  const headerInfo = viewHeaders[activeView] || viewHeaders.dashboard;

  const roleNotifs = notifications.filter(n => n.targetRole === currentRoleKey || n.targetRole === 'ALL' || n.targetRole === 'STUDENT');
  const unreadCount = roleNotifs.filter(n => !n.read).length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-group">
          <h1 id="pageTitle">{headerInfo.title}</h1>
          <p id="pageSubtitle">{headerInfo.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Role Impersonation Switchboard */}
        <div className="role-switch-container">
          <div className="role-switch-label">
            <span>🎭 Role Switcher:</span>
          </div>
          <select 
            id="roleSelect" 
            className="role-select"
            value={currentRoleKey}
            onChange={(e) => setCurrentRoleKey(e.target.value)}
          >
            <option value="HOD">👨‍💼 Head of Department (Dr. Rajeshwar Sen)</option>
            <option value="COORDINATOR">👩‍🏫 Project Coordinator (Dr. Ananya Roy)</option>
            <option value="FACULTY">👨‍🏫 Faculty Guide (Dr. Vikramaditya Das)</option>
            <option value="PG_STUDENT">🎓 PG Scholar (Sneha Mukherjee - M.Tech)</option>
            <option value="UG_STUDENT">🎒 UG Team 04 (Rahul Verma - B.Tech)</option>
          </select>
        </div>

        {/* Quick Proposal Action */}
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('NEW_SUBMISSION')}
          id="btnNewSubmission"
        >
          ➕ New Request
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="btn btn-icon" 
            id="notifButton" 
            title="System Notifications"
            onClick={() => setNotifOpen(prev => !prev)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge-pill" id="notifCountBadge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div 
              id="notifDropdown" 
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '340px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 150
              }}
            >
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Notifications ({unreadCount} unread)</strong>
                <span 
                  style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </span>
              </div>

              <div id="notifListContainer" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {roleNotifs.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No active notifications
                  </div>
                ) : (
                  roleNotifs.map(n => (
                    <div 
                      key={n.id} 
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: n.read ? 'var(--text-secondary)' : '#fff' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{n.timestamp}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Audit Export & Portal Reset */}
        <button 
          className="btn btn-icon" 
          onClick={handleExportAudit} 
          title="Export Audit JSON Ledger"
          id="btnExportAudit"
        >
          💾
        </button>
        <button 
          className="btn btn-icon" 
          onClick={handleResetEntirePortal} 
          title="Reset Portal Database"
          id="btnResetPortal"
        >
          🔄
        </button>

        {/* User Profile Badge */}
        <div className="user-profile-badge">
          <div className="user-avatar" id="headerUserAvatar">
            {currentRoleKey === 'HOD' ? '👨‍💼' :
             currentRoleKey === 'COORDINATOR' ? '👩‍🏫' :
             currentRoleKey === 'FACULTY' ? '👨‍🏫' :
             currentRoleKey === 'PG_STUDENT' ? '🎓' : '🎒'}
          </div>
          <div className="user-info">
            <span className="user-name" id="headerUserName">{currentRoleData.name}</span>
            <span className="user-role-label" id="headerUserRole">{currentRoleData.title}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
