import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  IconPlus,
  IconBell,
  IconDownload,
  IconRefresh,
  IconCheckCircle,
  IconClock,
  IconShield,
  IconUsers
} from './icons/Icons.jsx';

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

  const roleList = [
    { key: 'HOD', short: 'HOD', name: 'Dr. Sen', full: 'Head of Department' },
    { key: 'COORDINATOR', short: 'Coord', name: 'Dr. Roy', full: 'Project Coordinator' },
    { key: 'FACULTY', short: 'Guide', name: 'Dr. Das', full: 'Faculty Supervisor' },
    { key: 'PG_STUDENT', short: 'PG', name: 'Sneha M.', full: 'PG Scholar (M.Tech)' },
    { key: 'UG_STUDENT', short: 'UG', name: 'Team 04', full: 'UG Capstone (B.Tech)' }
  ];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-group">
          <h1 id="pageTitle">{headerInfo.title}</h1>
          <p id="pageSubtitle">{headerInfo.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Emil Kowalski Segmented Persona Switcher */}
        <div className="persona-switcher-wrapper">
          <div className="persona-switcher-track">
            {roleList.map(r => {
              const isActive = currentRoleKey === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  className={`persona-segment-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentRoleKey(r.key)}
                  title={`${r.full}: ${r.name}`}
                >
                  <span className="persona-tag">{r.short}</span>
                  <span className="persona-name">{r.name}</span>
                </button>
              );
            })}
          </div>

          {/* Hidden/accessible select element to guarantee backward-compatibility for automated test-runners looking for #roleSelect */}
          <select 
            id="roleSelect" 
            className="visually-hidden-sync"
            value={currentRoleKey}
            onChange={(e) => setCurrentRoleKey(e.target.value)}
            aria-label="Department Role Switcher"
          >
            <option value="HOD">Head of Department (Dr. Rajeshwar Sen)</option>
            <option value="COORDINATOR">Project Coordinator (Dr. Ananya Roy)</option>
            <option value="FACULTY">Faculty Guide (Dr. Vikramaditya Das)</option>
            <option value="PG_STUDENT">PG Scholar (Sneha Mukherjee - M.Tech)</option>
            <option value="UG_STUDENT">UG Team 04 (Rahul Verma - B.Tech)</option>
          </select>
        </div>

        {/* Quick Action: New Proposal */}
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('NEW_SUBMISSION')}
          id="btnNewSubmission"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <IconPlus size={15} />
          <span>New Request</span>
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="btn btn-icon" 
            id="notifButton" 
            title="System Notifications"
            onClick={() => setNotifOpen(prev => !prev)}
            aria-label="Notifications"
          >
            <IconBell size={17} />
            {unreadCount > 0 && (
              <span className="notif-badge-pill" id="notifCountBadge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div 
              id="notifDropdown" 
              className="popover-menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '350px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                zIndex: 150,
                animation: 'popoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                padding: '0.9rem 1.1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconBell size={15} className="text-cyan" />
                  <strong style={{ fontSize: '0.84rem', color: '#fff' }}>Notifications ({unreadCount})</strong>
                </div>
                {unreadCount > 0 && (
                  <button 
                    type="button"
                    style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 0 }}
                    onClick={markAllNotificationsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div id="notifListContainer" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {roleNotifs.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <IconCheckCircle size={24} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div>All caught up! No active notices</div>
                  </div>
                ) : (
                  roleNotifs.map(n => (
                    <div 
                      key={n.id} 
                      style={{
                        padding: '0.8rem 1.1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.07)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: n.read ? 'var(--text-secondary)' : '#fff' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <IconClock size={11} /> {n.timestamp}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
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
          title="Export Tamper-Evident Audit JSON Ledger"
          id="btnExportAudit"
          aria-label="Export Audit Ledger"
        >
          <IconDownload size={16} />
        </button>
        <button 
          className="btn btn-icon" 
          onClick={handleResetEntirePortal} 
          title="Reset Portal Database to Factory Baseline"
          id="btnResetPortal"
          aria-label="Reset Portal"
        >
          <IconRefresh size={16} />
        </button>

        {/* User Profile Badge */}
        <div className="user-profile-badge">
          <div className="user-avatar-initials" id="headerUserAvatar">
            {currentRoleKey === 'HOD' ? 'RS' :
             currentRoleKey === 'COORDINATOR' ? 'AR' :
             currentRoleKey === 'FACULTY' ? 'VD' :
             currentRoleKey === 'PG_STUDENT' ? 'SM' : 'T4'}
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
