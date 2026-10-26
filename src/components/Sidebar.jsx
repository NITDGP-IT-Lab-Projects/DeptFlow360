import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export const Sidebar = () => {
  const { activeView, setActiveView, workflows, currentRoleKey, currentRoleData, backendOnline } = useApp();

  // Calculate pending items for current role
  const pendingInboxCount = workflows.filter(w => {
    if (currentRoleKey === 'HOD') return w.state === 'UNDER_HOD_REVIEW';
    if (currentRoleKey === 'COORDINATOR') return w.state === 'UNDER_COORDINATOR_REVIEW';
    if (currentRoleKey === 'FACULTY') {
      return w.state === 'UNDER_GUIDE_REVIEW' && (
        w.details?.proposedGuideId === currentRoleData.id || 
        w.details?.allocatedGuideId === currentRoleData.id
      );
    }
    if (currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT') {
      return w.state === 'REVISION_REQUESTED' && w.submittedBy?.id === currentRoleData.id;
    }
    return false;
  }).length;

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">🎓</div>
        <div>
          <div className="brand-title">DeptFlow 360</div>
          <div className="brand-subtitle">IT Lab • Project VII</div>
        </div>
      </div>

      <div className="nav-category">Main Workspace</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
            id="nav-dashboard"
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a 
            className={`nav-link ${activeView === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveView('approvals')}
            id="nav-approvals"
          >
            <span className="nav-icon">⚡</span>
            <span>Approvals Inbox</span>
            {pendingInboxCount > 0 && (
              <span className="nav-badge" id="inboxNavBadge">{pendingInboxCount}</span>
            )}
          </a>
        </li>
        <li>
          <a 
            className={`nav-link ${activeView === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveView('allocation')}
            id="nav-allocation"
          >
            <span className="nav-icon">🎯</span>
            <span>Project Allocation</span>
          </a>
        </li>
      </ul>

      <div className="nav-category">Academic Operations</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'ugpg_desk' ? 'active' : ''}`}
            onClick={() => setActiveView('ugpg_desk')}
            id="nav-ugpg_desk"
          >
            <span className="nav-icon">📚</span>
            <span>UG & PG Activity Desk</span>
          </a>
        </li>
        <li>
          <a 
            className={`nav-link ${activeView === 'rubric_eval' ? 'active' : ''}`}
            onClick={() => setActiveView('rubric_eval')}
            id="nav-rubric_eval"
          >
            <span className="nav-icon">⚖️</span>
            <span>Defense & Rubrics</span>
          </a>
        </li>
        <li>
          <a 
            className={`nav-link ${activeView === 'faculty_dir' ? 'active' : ''}`}
            onClick={() => setActiveView('faculty_dir')}
            id="nav-faculty_dir"
          >
            <span className="nav-icon">👨‍🏫</span>
            <span>Faculty Quotas</span>
          </a>
        </li>
      </ul>

      <div className="nav-category">Engineering & Specs</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveView('architecture')}
            id="nav-architecture"
          >
            <span className="nav-icon">🏛️</span>
            <span>System Architecture</span>
          </a>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="system-status-card">
          <div className="status-row">
            <div className={`pulse-dot ${backendOnline ? 'online' : ''}`} style={backendOnline ? { background: '#10b981', boxShadow: '0 0 8px #10b981' } : {}}></div>
            <span>Workflow Engine: <strong>Active</strong></span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {backendOnline ? (
              <span style={{ color: 'var(--status-approved)' }}>📡 MongoDB Atlas Synced</span>
            ) : (
              <span>💾 LocalStore Resilient Mode</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
