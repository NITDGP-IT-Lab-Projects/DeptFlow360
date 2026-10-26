import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconSearch,
  IconClock,
  IconZap,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronRight
} from '../icons/Icons.jsx';

export const ApprovalsView = () => {
  const { workflows, currentRoleKey, currentRoleData, openModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
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
        if (currentRoleKey === 'HOD') return wf.state === 'UNDER_HOD_REVIEW';
        if (currentRoleKey === 'COORDINATOR') return wf.state === 'UNDER_COORDINATOR_REVIEW';
        if (currentRoleKey === 'FACULTY') {
          return wf.state === 'UNDER_GUIDE_REVIEW' && (
            wf.details?.proposedGuideId === currentRoleData.id || 
            wf.details?.allocatedGuideId === currentRoleData.id
          );
        }
        if (currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT') {
          return wf.state === 'REVISION_REQUESTED' && wf.submittedBy?.id === currentRoleData.id;
        }
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
  }, [workflows, searchTerm, activeFilter, currentRoleKey, currentRoleData]);

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
                      <div style={{ fontWeight: 600, color: '#fff' }}>{wf.title}</div>
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
