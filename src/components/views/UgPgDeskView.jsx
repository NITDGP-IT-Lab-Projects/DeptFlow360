import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconPlus,
  IconBook,
  IconChevronRight,
  IconCheckCircle,
  IconClock
} from '../icons/Icons.jsx';

export const UgPgDeskView = () => {
  const { workflows, openModal } = useApp();

  const studentWorkflows = workflows.filter(w => w.category === 'UG' || w.category === 'PG');

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
    <div id="view-ugpg_desk" className="view-section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '4px' }}>
            Academic Submissions & Project Lifecycle
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage active B.Tech Capstone or M.Tech Dissertation tracks, monitor multi-tier approvals, and track milestone grades
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('NEW_SUBMISSION')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <IconPlus size={15} />
          <span>Submit Proposal / Application</span>
        </button>
      </div>

      <div id="studentSubmissionsList">
        {studentWorkflows.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <IconBook size={28} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <div>No student project tracks currently registered.</div>
          </div>
        ) : (
          studentWorkflows.map(wf => (
            <div key={wf.id} className="card-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                    <span className="wf-id">{wf.id}</span>
                    <span className={`type-tag ${wf.category.toLowerCase()}`}>{wf.category}</span>
                    <span className={getStatusBadgeClass(wf.state)}>{formatStateLabel(wf.state)}</span>
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.08rem', margin: '4px 0' }}>{wf.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Submitter: <strong style={{ color: 'var(--text-secondary)' }}>{wf.submittedBy?.name}</strong> • 
                    Domain: <span style={{ color: 'var(--accent-cyan)' }}>{wf.details?.domain}</span> • 
                    Supervisor: <strong style={{ color: 'var(--text-primary)' }}>{wf.details?.guideName || wf.details?.allocatedGuideId || 'Pending Allotment'}</strong>
                  </div>
                </div>

                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => openModal('DETAIL', wf)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Details & Audit Trail</span>
                  <IconChevronRight size={13} />
                </button>
              </div>

              {/* Milestones Progression */}
              {wf.milestones && wf.milestones.length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Continuous Assessment Milestones
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    {wf.milestones.map((m, idx) => (
                      <div 
                        key={m.id || idx} 
                        style={{
                          background: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{m.name}</strong>
                          <span 
                            className={`status-badge ${m.status === 'EVALUATED' ? 'APPROVED' : 'UNDER_GUIDE_REVIEW'}`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {m.status || 'PENDING'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Weightage: {m.weightage}% • Deadline: {m.deadline}
                        </div>
                        {m.score !== null && m.score !== undefined ? (
                          <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--status-approved)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheckCircle size={13} />
                            <span>Graded: {m.score} / 100</span>
                          </div>
                        ) : (
                          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconClock size={12} />
                            <span>Evaluation Pending</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
