import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconSearch,
  IconClock,
  IconZap,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronRight,
  IconShield,
  IconBook
} from '../icons/Icons.jsx';

export const ApprovalsView = () => {
  const { workflows, facultyList, currentRoleKey, currentRoleData, currentUser, openModal, setActiveView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const isStudent = currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT';
  const isFaculty = currentRoleKey === 'FACULTY';
  const isCoordinator = currentRoleKey === 'COORDINATOR';
  const isHOD = currentRoleKey === 'HOD';

  const myFacultyRecord = facultyList?.find(f => 
    f.id === currentRoleData?.id || 
    f.id === currentUser?.referenceId ||
    f.name === currentRoleData?.name ||
    f.email === currentUser?.email
  );
  const activeFacultyId = myFacultyRecord?.id || currentUser?.referenceId || currentRoleData?.id;

  // Base pool of workflows strictly isolated by reviewer role
  const baseWorkflows = useMemo(() => {
    if (isHOD || isCoordinator) return workflows;
    if (isFaculty) {
      return workflows.filter(wf => 
        wf.details?.proposedGuideId === activeFacultyId || 
        wf.details?.allocatedGuideId === activeFacultyId ||
        wf.details?.proposedGuideId === currentRoleData?.id || 
        wf.details?.allocatedGuideId === currentRoleData?.id ||
        (currentUser?.name && wf.details?.guideName && wf.details.guideName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (currentRoleData?.name && wf.details?.guideName && wf.details.guideName.toLowerCase().includes(currentRoleData.name.toLowerCase())) ||
        wf.state === 'UNDER_GUIDE_REVIEW'
      );
    }
    return [];
  }, [workflows, isHOD, isCoordinator, isFaculty, currentRoleData, currentUser, activeFacultyId]);

  const filteredWorkflows = useMemo(() => {
    return baseWorkflows.filter(wf => {
      // 1. Search filter
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || (
        wf.id.toLowerCase().includes(q) ||
        wf.title.toLowerCase().includes(q) ||
        (wf.submittedBy?.name && wf.submittedBy.name.toLowerCase().includes(q)) ||
        (wf.details?.domain && wf.details.domain.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;

      // 2. Filter pill logic
      if (activeFilter === 'ALL') return true;

      if (activeFilter === 'PENDING_ME') {
        if (isHOD) return wf.state === 'UNDER_HOD_REVIEW';
        if (isCoordinator) return wf.state === 'UNDER_COORDINATOR_REVIEW';
        if (isFaculty) return wf.state === 'UNDER_GUIDE_REVIEW';
        return false;
      }

      if (activeFilter === 'UNDER_REVIEW') {
        return ['UNDER_GUIDE_REVIEW', 'UNDER_COORDINATOR_REVIEW', 'UNDER_HOD_REVIEW'].includes(wf.state);
      }

      if (activeFilter === 'UG') return wf.category === 'UG';
      if (activeFilter === 'PG') return wf.category === 'PG';
      if (activeFilter === 'APPROVED') return wf.state === 'APPROVED';

      return true;
    });
  }, [baseWorkflows, searchTerm, activeFilter, isHOD, isCoordinator, isFaculty]);

  const getStatusBadgeClass = (state) => {
    switch (state) {
      case 'APPROVED': return 'status-badge APPROVED';
      case 'REJECTED': return 'status-badge REJECTED';
      case 'REVISION_REQUESTED': return 'status-badge REVISION_REQUESTED';
      case 'UNDER_HOD_REVIEW': return 'status-badge UNDER_HOD_REVIEW';
      case 'UNDER_COORDINATOR_REVIEW': return 'status-badge UNDER_COORDINATOR_REVIEW';
      default: return 'status-badge UNDER_GUIDE_REVIEW';
    }
  };

  const formatStateLabel = (state) => {
    switch (state) {
      case 'APPROVED': return 'Sanctioned';
      case 'REJECTED': return 'Rejected';
      case 'REVISION_REQUESTED': return 'Revision Requested';
      case 'UNDER_HOD_REVIEW': return 'Under HOD Review';
      case 'UNDER_COORDINATOR_REVIEW': return 'Under Coordinator Review';
      case 'UNDER_GUIDE_REVIEW': return 'Under Guide Review';
      default: return state;
    }
  };

  if (isStudent) {
    return (
      <div id="view-approvals" className="view-section active">
        <div className="card-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <IconShield size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Review & Sanction Authority Restricted
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The Multi-Tier Approvals Inbox is restricted to supervisory and administrative roles (Faculty Guide, Coordinator, and HOD). Students can view their proposals, track approval status, and submit revisions via their dedicated Submissions Desk.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => setActiveView('ugpg_desk')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <IconBook size={15} />
            <span>Go to My Submissions Desk</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="view-approvals" className="view-section active">
      <div className="card-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <IconSearch size={16} className="search-icon" />
            <input 
              type="text" 
              id="workflowSearchInput"
              placeholder="Search by title, ID, submitter, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {[
              { id: 'ALL', label: 'All Records' },
              { id: 'PENDING_ME', label: 'Needs My Action', icon: <IconZap size={13} className="text-amber" /> },
              { id: 'UNDER_REVIEW', label: 'In Review' },
              { id: 'UG', label: 'UG Capstones' },
              { id: 'PG', label: 'PG Dissertations' },
              { id: 'APPROVED', label: 'Sanctioned', icon: <IconCheckCircle size={13} className="text-emerald" /> }
            ].map(pill => (
              <button
                key={pill.id}
                className={`filter-pill ${activeFilter === pill.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(pill.id)}
              >
                {pill.icon && <span style={{ marginRight: '5px', display: 'inline-flex', verticalAlign: 'middle' }}>{pill.icon}</span>}
                {pill.label}
              </button>
            ))}
          </div>

          <span className="record-counter-badge" id="approvalsCountBadge">
            {filteredWorkflows.length} record{filteredWorkflows.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Proposal Title & Team</th>
                <th>Track</th>
                <th>Current State</th>
                <th>SLA Countdown</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="approvalsTableBody">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <IconAlertCircle size={28} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No matching workflows found</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Try clearing filters or search terms</div>
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map(wf => (
                  <tr key={wf.id}>
                    <td><span className="wf-id">{wf.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wf.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Lead: {wf.submittedBy?.name} • Domain: {wf.details?.domain || 'General IT'}
                      </div>
                    </td>
                    <td>
                      <span className={`type-tag ${wf.category.toLowerCase()}`}>
                        {wf.category}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(wf.state)}>
                        {formatStateLabel(wf.state)}
                      </span>
                    </td>
                    <td>
                      <span className="sla-pill" style={{ color: wf.slaDaysRemaining <= 2 ? 'var(--status-rejected)' : 'var(--text-secondary)' }}>
                        <IconClock size={12} />
                        <span>{wf.slaDaysRemaining}d remaining</span>
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal('DETAIL', wf)}
                      >
                        Review / Sanction
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
