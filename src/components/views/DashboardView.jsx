import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

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
  auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentAudit = auditEvents.slice(0, 6);

  // Dynamic Directive Banner content
  const directive = {
    HOD: {
      title: `Head of Department Authority • ${pendingActionCount} Pending Clearances`,
      desc: `You have final executive sanctioning powers. ${pendingActionCount} item(s) are awaiting your formal sign-off.`,
      btnText: "Review Pending Clearances",
      action: () => setActiveView('approvals')
    },
    COORDINATOR: {
      title: "Project Coordinator Desk • Allocation & Quota Oversight",
      desc: "Supervise UG/PG capstone tracks, verify supervisor quotas, and execute automated Gale-Shapley matching.",
      btnText: "Manage Project Allocation",
      action: () => setActiveView('allocation')
    },
    FACULTY: {
      title: `Faculty Guide Desk • ${currentRoleData.name}`,
      desc: "Review supervisee proposals, grade defense milestones against ABET/NBA rubrics, and provide feedback.",
      btnText: "Open Rubric Station",
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

  return (
    <div id="view-dashboard" className="view-section active">
      {/* Role Directive Callout */}
      <div className="role-directive-banner">
        <div className="role-directive-content">
          <h2 id="directiveTitle">{directive.title}</h2>
          <p id="directiveDesc">{directive.desc}</p>
        </div>
        <button className="btn btn-primary" id="directiveActionBtn" onClick={directive.action}>
          {directive.btnText}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Total Workflows</h3>
            <div className="kpi-value" id="kpiTotalWorkflows">{totalWorkflows}</div>
            <div className="kpi-meta">Active departmental tracks</div>
          </div>
          <div className="kpi-icon-badge indigo">📋</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Action Required</h3>
            <div className="kpi-value" id="kpiPendingAction" style={{ color: 'var(--status-pending)' }}>
              {pendingActionCount}
            </div>
            <div className="kpi-meta">Awaiting your approval tier</div>
          </div>
          <div className="kpi-icon-badge amber">⏳</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Sanctioned Projects</h3>
            <div className="kpi-value" id="kpiApproved" style={{ color: 'var(--status-approved)' }}>
              {approvedCount}
            </div>
            <div className="kpi-meta">Passed HOD final clearance</div>
          </div>
          <div className="kpi-icon-badge emerald">✅</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Faculty Quota Load</h3>
            <div className="kpi-value" id="kpiQuotaLoad" style={{ color: 'var(--accent-cyan)' }}>
              {quotaLoadPercent}%
            </div>
            <div className="kpi-meta">Department capacity utilized</div>
          </div>
          <div className="kpi-icon-badge cyan">👥</div>
        </div>
      </div>

      {/* Dashboard Columns */}
      <div className="dashboard-columns">
        {/* Left: Quick Action Table */}
        <div className="card-panel">
          <div className="card-panel-header">
            <h2>⚡ Pending & Relevant Approvals</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('approvals')}>
              View All In Inbox →
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
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active workflows matching current role
                    </td>
                  </tr>
                ) : (
                  relevantWorkflows.map(wf => (
                    <tr key={wf.id}>
                      <td><span className="wf-id">{wf.id}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{wf.title}</div>
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
                        <span style={{ fontSize: '0.8rem', color: wf.slaDaysRemaining <= 2 ? 'var(--status-rejected)' : 'var(--text-secondary)' }}>
                          ⏱️ {wf.slaDaysRemaining}d left
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
            <h2>📜 Departmental Audit Stream</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time Ledger</span>
          </div>
          <div className="audit-timeline" id="recentActivityList">
            {recentAudit.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                No audit events recorded yet
              </div>
            ) : (
              recentAudit.map((event, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-icon">📝</div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#fff' }}>{event.action}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{event.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                      [{event.workflowId}] {event.actorName} ({event.actorRole})
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
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
