import React from 'react';

export const ArchitectureView = () => {
  return (
    <div id="view-architecture" className="view-section active">
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="card-panel-header">
          <h2>🏛️ System Architecture: Event-Driven Workflow State Engine</h2>
          <span className="type-tag dept">Architecture Design</span>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          DAWMS models academic clearances as a deterministic finite-state automaton. Transitions between states require explicit role capability tokens, pass quota guards, and produce tamper-evident audit records in the departmental ledger.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#a5b4fc', lineHeight: 1.6 }}>
          [DRAFT] --(Student Submit)--> [UNDER_GUIDE_REVIEW]<br />
          &nbsp;&nbsp;├── [GUIDE_ENDORSE] --(Quota Guard OK)--> [UNDER_COORDINATOR_REVIEW]<br />
          &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── [COORDINATOR_VERIFY] --------&gt; [UNDER_HOD_REVIEW]<br />
          &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── [HOD_APPROVE] ---------&gt; [APPROVED / SANCTIONED]<br />
          &nbsp;&nbsp;├── [REQUEST_REVISION] -------------------------&gt; [REVISION_REQUESTED] (Student Resubmits)<br />
          &nbsp;&nbsp;└── [REJECT] -----------------------------------&gt; [TERMINAL REJECTION]
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="card-panel">
          <div className="card-panel-header">
            <h2>🔐 Role-Based Access Control (RBAC) Matrix</h2>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Allowed Operations</th>
                  <th>Approval Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="status-badge UNDER_HOD_REVIEW">HOD</span></td>
                  <td>Final Sanction, Budget Approval, Allocation Override</td>
                  <td>All UG, PG & Departmental</td>
                </tr>
                <tr>
                  <td><span className="status-badge UNDER_COORDINATOR_REVIEW">Coordinator</span></td>
                  <td>Run Allocation, Verify Quotas, Schedule Defense</td>
                  <td>B.Tech & M.Tech Academic</td>
                </tr>
                <tr>
                  <td><span className="status-badge UNDER_GUIDE_REVIEW">Faculty Guide</span></td>
                  <td>Proposal Endorsement, Rubric Scoring, Meetings</td>
                  <td>Supervised Advisees</td>
                </tr>
                <tr>
                  <td><span className="status-badge APPROVED">PG Scholar</span></td>
                  <td>Dissertation Upload, RAC Submission, NOC</td>
                  <td>Individual Thesis Track</td>
                </tr>
                <tr>
                  <td><span className="status-badge REVISION_REQUESTED">UG Student</span></td>
                  <td>Capstone Proposal, Guide Bidding, Milestones</td>
                  <td>Team Submissions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-panel-header">
            <h2>⚙️ Software Interface Contracts</h2>
          </div>
          <ul style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
            <li><strong>IWorkflowItem:</strong> Stateful model maintaining history audit records, milestones, SLA timers, and submitter metadata.</li>
            <li><strong>IFacultyQuota:</strong> Enforces dynamic supervision thresholds preventing faculty overload.</li>
            <li><strong>IEvaluationRubric:</strong> ABET/NBA aligned criteria vectors calculating quantitative oral and technical marks.</li>
            <li><strong>DeptStore:</strong> Isolated local storage persistence layer with automated state recovery and JSON migration.</li>
            <li><strong>REST API Gateway:</strong> Express & MongoDB Atlas backend endpoints with dual-mode offline sync.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
