import React from 'react';
import {
  IconArchitecture,
  IconShield,
  IconZap,
  IconCheckCircle
} from '../icons/Icons.jsx';

export const ArchitectureView = () => {
  return (
    <div id="view-architecture" className="view-section active">
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="card-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconArchitecture size={20} className="text-cyan" />
            <h2>System Architecture: Event-Driven Workflow State Engine</h2>
          </div>
          <span className="type-tag dept">Architecture Design</span>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          DAWMS models academic clearances as a deterministic finite-state automaton. Transitions between states require explicit role capability tokens, pass quota guards, and produce tamper-evident audit records in the departmental ledger.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#a5b4fc', lineHeight: 1.7 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconShield size={18} className="text-indigo" />
              <h2>Role-Based Access Control (RBAC) Matrix</h2>
            </div>
            <span className="live-pill">Strict Enforcement</span>
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
                  <td><span className="status-badge APPROVED">UG Student</span></td>
                  <td>Capstone Team Registration, Milestone Submission</td>
                  <td>Assigned Team Scope</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconZap size={18} className="text-amber" />
              <h2>Algorithm Specification: Gale-Shapley Matching</h2>
            </div>
            <span className="live-pill">O(N × M) Stable</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              The Gale-Shapley hospital-residents variant matches student project groups with supervisor quotas under strict Pareto-optimality guarantees:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Merit Pre-Ordering:</strong> Student teams sorted descending by Cumulative Grade Point Average (CGPA).</li>
              <li><strong>Proposals:</strong> Teams submit ranked preference arrays <code>[P1, P2, P3]</code> to available faculty.</li>
              <li><strong>Quota Guard:</strong> Faculty provisionally accept up to <code>maxQuota</code>. Overflow triggers re-bidding to subsequent preference.</li>
              <li><strong>Audit Integrity:</strong> Manual overrides recorded with timestamp and reason.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
