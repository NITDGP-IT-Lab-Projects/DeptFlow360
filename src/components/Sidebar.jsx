import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  IconDashboard,
  IconInbox,
  IconTarget,
  IconBook,
  IconScale,
  IconUsers,
  IconArchitecture,
  IconGraduationCap,
  IconActivity
} from './icons/Icons.jsx';

export const Sidebar = () => {
  const { activeView, setActiveView, workflows, currentRoleKey, currentRoleData, currentUser, backendOnline } = useApp();

  const isStudent = currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT';
  const isFaculty = currentRoleKey === 'FACULTY';
  const isCoordinator = currentRoleKey === 'COORDINATOR';
  const isHOD = currentRoleKey === 'HOD';

  // Calculate pending items for current role
  const pendingInboxCount = workflows.filter(w => {
    if (currentRoleKey === 'HOD') return w.state === 'UNDER_HOD_REVIEW';
    if (currentRoleKey === 'COORDINATOR') return w.state === 'UNDER_COORDINATOR_REVIEW';
    if (currentRoleKey === 'FACULTY') {
      return w.state === 'UNDER_GUIDE_REVIEW' && (
        w.details?.proposedGuideId === currentRoleData.id || 
        w.details?.allocatedGuideId === currentRoleData.id ||
        (currentRoleData?.name && w.details?.guideName && w.details.guideName.toLowerCase().includes(currentRoleData.name.toLowerCase()))
      );
    }
    return false;
  }).length;

  return (
    <aside className="sidebar">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo">
          <IconGraduationCap size={20} />
        </div>
        <div>
          <div className="brand-title">DeptFlow 360</div>
          <div className="brand-subtitle">IT Lab • Project VII</div>
        </div>
      </div>

      {/* Main Workspace Navigation */}
      <div className="nav-category">Main Workspace</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
            id="nav-dashboard"
          >
            <span className="nav-icon"><IconDashboard size={17} /></span>
            <span>{isStudent ? 'My Scholar Dashboard' : 'Dashboard'}</span>
          </a>
        </li>

        {/* Approvals Inbox: Restricted strictly to Reviewers (Faculty, Coordinator, HOD) */}
        {!isStudent && (
          <li>
            <a 
              className={`nav-link ${activeView === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveView('approvals')}
              id="nav-approvals"
            >
              <span className="nav-icon"><IconInbox size={17} /></span>
              <span>Approvals Inbox</span>
              {pendingInboxCount > 0 && (
                <span className="nav-badge" id="inboxNavBadge">{pendingInboxCount}</span>
              )}
            </a>
          </li>
        )}

        <li>
          <a 
            className={`nav-link ${activeView === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveView('allocation')}
            id="nav-allocation"
          >
            <span className="nav-icon"><IconTarget size={17} /></span>
            <span>{isStudent ? 'Project Allotment' : 'Project Allocation'}</span>
          </a>
        </li>
      </ul>

      {/* Academic Operations */}
      <div className="nav-category">Academic Operations</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'ugpg_desk' ? 'active' : ''}`}
            onClick={() => setActiveView('ugpg_desk')}
            id="nav-ugpg_desk"
          >
            <span className="nav-icon"><IconBook size={17} /></span>
            <span>{isStudent ? 'My Submissions Desk' : 'UG & PG Activity Desk'}</span>
          </a>
        </li>

        {/* Defense & Rubrics: Restricted to Faculty / Coordinator / HOD */}
        {!isStudent && (
          <li>
            <a 
              className={`nav-link ${activeView === 'rubric_eval' ? 'active' : ''}`}
              onClick={() => setActiveView('rubric_eval')}
              id="nav-rubric_eval"
            >
              <span className="nav-icon"><IconScale size={17} /></span>
              <span>Defense & Rubrics</span>
            </a>
          </li>
        )}

        {/* Faculty Quotas: Restricted to Faculty / Coordinator / HOD */}
        {!isStudent && (
          <li>
            <a 
              className={`nav-link ${activeView === 'faculty_dir' ? 'active' : ''}`}
              onClick={() => setActiveView('faculty_dir')}
              id="nav-faculty_dir"
            >
              <span className="nav-icon"><IconUsers size={17} /></span>
              <span>Faculty Quotas</span>
            </a>
          </li>
        )}
      </ul>

      {/* Engineering & Specs */}
      <div className="nav-category">Engineering & Specs</div>
      <ul className="nav-list">
        <li>
          <a 
            className={`nav-link ${activeView === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveView('architecture')}
            id="nav-architecture"
          >
            <span className="nav-icon"><IconArchitecture size={17} /></span>
            <span>System Architecture</span>
          </a>
        </li>
      </ul>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="system-status-card">
          <div className="status-row">
            <div className={`pulse-dot ${backendOnline ? 'online' : ''}`} style={backendOnline ? { background: '#10b981', boxShadow: '0 0 10px #10b981' } : {}}></div>
            <span style={{ fontSize: '0.78rem' }}>Session: <strong>Verified</strong></span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconActivity size={12} className={backendOnline ? 'text-emerald' : 'text-slate'} />
            {backendOnline ? (
              <span style={{ color: 'var(--status-approved)' }}>MongoDB Atlas Synced</span>
            ) : (
              <span>Local Store Active</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
