import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconFileText,
  IconClock,
  IconCheckCircle,
  IconUsers,
  IconZap,
  IconActivity,
  IconChevronRight,
  IconArrowRight
} from '../icons/Icons.jsx';

export const DashboardView = () => {
  const { 
    workflows, 
    facultyList, 
    currentRoleKey, 
    currentRoleData, 
    setActiveView, 
    openModal 
  } = useApp();

  // Metrics calculation
  const totalWorkflows = workflows.length;

  const pendingActionCount = workflows.filter(w => {
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

  const approvedCount = workflows.filter(w => w.state === 'APPROVED').length;

  // Calculate quota load
  const totalMaxQuota = facultyList.reduce((acc, f) => acc + (f.ugQuotaMax || 0) + (f.pgQuotaMax || 0), 0);
  const totalUsedQuota = facultyList.reduce((acc, f) => acc + (f.ugQuotaCurrent || 0) + (f.pgQuotaCurrent || 0), 0);
  const quotaLoadPercent = totalMaxQuota > 0 ? Math.round((totalUsedQuota / totalMaxQuota) * 100) : 0;

  // Filter relevant workflows for quick table
  const relevantWorkflows = workflows.filter(w => {
    if (currentRoleKey === 'HOD') return true;
    if (currentRoleKey === 'COORDINATOR') return true;
    if (currentRoleKey === 'FACULTY') {
      return w.details?.allocatedGuideId === currentRoleData.id || 
             w.details?.proposedGuideId === currentRoleData.id ||
             w.submittedBy?.id === currentRoleData.id ||
             w.category === 'DEPARTMENTAL';
    }
    return w.submittedBy?.id === currentRoleData.id;
  }).slice(0, 5);

  // Compile audit events from all workflows
  const auditEvents = [];
  workflows.forEach(w => {
    if (w.history && Array.isArray(w.history)) {
      w.history.forEach(h => {
        auditEvents.push({
          ...h,
          workflowId: w.id,
          workflowTitle: w.title
        });
      });
    }
  });

  const recentAudit = auditEvents
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Role directives configuration
  const directive = {
    HOD: {
      title: `Executive Authority Desk • ${pendingActionCount} Clearances Pending`,
      desc: `You have final departmental sign-off authority. ${pendingActionCount} proposal(s) currently await your formal sanction.`,
      btnText: "Review Clearances",
      action: () => setActiveView('approvals')
    },
    COORDINATOR: {
      title: "Project Coordinator Desk • Allocation & Quota Engine",
      desc: "Supervise UG/PG capstone tracks, verify supervisor quotas, and execute automated Gale-Shapley matching.",
      btnText: "Manage Project Allocation",
      action: () => setActiveView('allocation')
    },
    FACULTY: {
      title: `Faculty Guide Station • ${currentRoleData.name}`,
      desc: "Review supervisee proposals, grade defense milestones against ABET/NBA rubrics, and record feedback.",
      btnText: "Open Defense Station",
      action: () => setActiveView('rubric_eval')
    },
    PG_STUDENT: {
      title: "M.Tech Dissertation Progression Desk",
      desc: "Track RAC reviews, submit dissertation synopsis, and manage conference/internship NOC approvals.",
      btnText: "View My Submissions",
      action: () => setActiveView('ugpg_desk')
    },
    UG_STUDENT: {
      title: "B.Tech Capstone Project Track (Team 04)",
      desc: "Monitor guide allotment, track milestone submissions, and prepare for continuous assessment defenses.",
      btnText: "Check Allotment Status",
      action: () => setActiveView('allocation')
    }
  }[currentRoleKey] || {
    title: "Departmental Operations",
    desc: "Welcome to DeptFlow 360",
    btnText: "Go to Inbox",
    action: () => setActiveView('approvals')
  };

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
      case 'REVISION_REQUESTED': return 'Revision Required';
      case 'UNDER_HOD_REVIEW': return 'Under HOD Review';
      case 'UNDER_COORDINATOR_REVIEW': return 'Under Coordinator Review';
      case 'UNDER_GUIDE_REVIEW': return 'Under Guide Review';
      default: return state;
    }
  };

  // SVG Radial Meter calculation
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const quotaStrokeDashoffset = circumference - (quotaLoadPercent / 100) * circumference;

  return (
    <div id="view-dashboard" className="view-section active">
      {/* Role Directive Callout */}
      <div className="role-directive-banner">
        <div className="role-directive-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="live-pill">
              <span className="live-pill-dot"></span> Active Session
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {currentRoleKey}</span>
          </div>
          <h2 id="directiveTitle">{directive.title}</h2>
          <p id="directiveDesc">{directive.desc}</p>
        </div>
        <button className="btn btn-primary" id="directiveActionBtn" onClick={directive.action} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{directive.btnText}</span>
          <IconArrowRight size={14} />
        </button>
      </div>

      {/* Emil Kowalski KPI Metric Cards with Precision Gauges */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Total Workflows</h3>
            <div className="kpi-value" id="kpiTotalWorkflows">{totalWorkflows}</div>
            <div className="kpi-meta">Active departmental tracks</div>
          </div>
          <div className="kpi-icon-badge indigo">
            <IconFileText size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Action Required</h3>
            <div className="kpi-value" id="kpiPendingAction" style={{ color: 'var(--status-pending)' }}>
              {pendingActionCount}
            </div>
            <div className="kpi-meta">Awaiting your approval tier</div>
          </div>
          <div className="kpi-icon-badge amber">
            <IconClock size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Sanctioned Projects</h3>
            <div className="kpi-value" id="kpiApproved" style={{ color: 'var(--status-approved)' }}>
              {approvedCount}
            </div>
            <div className="kpi-meta">Passed HOD final clearance</div>
          </div>
          <div className="kpi-icon-badge emerald">
            <IconCheckCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Faculty Quota Load</h3>
            <div className="kpi-value" id="kpiQuotaLoad" style={{ color: 'var(--accent-cyan)' }}>
              {quotaLoadPercent}%
            </div>
            <div className="kpi-meta">{totalUsedQuota} of {totalMaxQuota} slots assigned</div>
          </div>
          {/* Circular SVG Gauge Meter */}
          <div className="kpi-gauge-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56" className="kpi-gauge-svg">
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="kpi-gauge-bg"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="kpi-gauge-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: quotaStrokeDashoffset
                }}
              />
            </svg>
            <div className="kpi-gauge-icon">
              <IconUsers size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Columns */}
      <div className="dashboard-columns">
        {/* Left: Quick Action Table */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconZap size={18} className="text-amber" />
              <h2>Pending & Relevant Approvals</h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('approvals')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <IconChevronRight size={13} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title & Submitter</th>
                  <th>Track</th>
                  <th>Stage</th>
                  <th>SLA</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="dashboardQuickTableBody">
                {relevantWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No active workflows matching current role
                    </td>
                  </tr>
                ) : (
                  relevantWorkflows.map(wf => (
                    <tr key={wf.id}>
                      <td><span className="wf-id">{wf.id}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wf.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {wf.submittedBy?.name}
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
                          <span>{wf.slaDaysRemaining}d left</span>
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => openModal('DETAIL', wf)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="card-panel">
          <div className="card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconActivity size={18} className="text-cyan" />
              <h2>Departmental Audit Stream</h2>
            </div>
            <span className="live-pill">
              <span className="live-pill-dot"></span> Live
            </span>
          </div>
          <div className="audit-timeline" id="recentActivityList">
            {recentAudit.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No audit events recorded yet
              </div>
            ) : (
              recentAudit.map((event, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-icon">
                    <IconActivity size={14} />
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{event.action}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{event.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 500 }}>
                      [{event.workflowId}] {event.actorName} ({event.actorRole})
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                      {event.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
