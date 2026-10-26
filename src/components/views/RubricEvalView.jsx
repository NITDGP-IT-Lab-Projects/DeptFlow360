import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const RubricEvalView = () => {
  const { workflows, openModal, currentRoleKey } = useApp();

  const evaluatableWorkflows = workflows.filter(w => w.milestones && w.milestones.length > 0);

  const canGrade = currentRoleKey === 'FACULTY' || currentRoleKey === 'COORDINATOR' || currentRoleKey === 'HOD';

  return (
    <div id="view-rubric_eval" className="view-section active">
      {/* Criteria Framework Summary */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="card-panel-header">
          <h2>⚖️ Continuous Assessment Rubric Framework</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ABET / NBA Compliant Scoring</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Evaluations are computed across three standardized dimensions: 
          <strong> Literature Survey & Problem Formulation (30 pts)</strong>, 
          <strong> Technical Rigor & Mathematical Architecture (40 pts)</strong>, and 
          <strong> Viva Voce Demonstration & Q&A (30 pts)</strong>.
          Grades are computed dynamically based on total composite marks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700 }}>Criterion 1 (30 pts)</span>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem', margin: '4px 0' }}>Literature Review & SOTA</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Citation quality, problem gap clarity, benchmark metrics</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700 }}>Criterion 2 (40 pts)</span>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem', margin: '4px 0' }}>Methodology & Technical Rigor</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mathematical rigor, system architecture, modular software testing</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700 }}>Criterion 3 (30 pts)</span>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem', margin: '4px 0' }}>Viva Voce & Demonstration</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Working prototype, cross-examination defense, individual contribution</div>
          </div>
        </div>
      </div>

      {/* Evaluation Roster */}
      <div id="rubricEvaluationList">
        {evaluatableWorkflows.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No defense tracks currently awaiting milestone evaluation.
          </div>
        ) : (
          evaluatableWorkflows.map(wf => (
            <div key={wf.id} className="card-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="wf-id">{wf.id}</span>
                    <span className={`type-tag ${wf.category.toLowerCase()}`}>{wf.category}</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: '4px 0' }}>{wf.title}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Candidate Consortia: <strong>{wf.submittedBy?.name}</strong> • Supervisor: <strong>{wf.details?.guideName || wf.details?.allocatedGuideId || 'Pending'}</strong>
                  </div>
                </div>
              </div>

              {/* Milestones to grade */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {wf.milestones.map((m) => {
                  const isEvaluated = m.status === 'EVALUATED' && m.score !== null;

                  return (
                    <div 
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{m.name}</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Weightage: {m.weightage}% • Max Score: {m.maxScore || 100} • Target: {m.deadline}
                        </div>
                        {isEvaluated && m.feedback && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            💬 <em>"{m.feedback}"</em> — <span style={{ color: 'var(--accent-cyan)' }}>{m.evaluator}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isEvaluated ? (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-approved)' }}>
                              {m.score} / 100
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {m.score >= 90 ? 'Outstanding (O)' : m.score >= 80 ? 'Excellent (E)' : m.score >= 70 ? 'Very Good (A)' : 'Good (B)'}
                            </span>
                          </div>
                        ) : (
                          <span className="status-badge UNDER_GUIDE_REVIEW" style={{ fontSize: '0.75rem' }}>
                            Awaiting Evaluation
                          </span>
                        )}

                        {canGrade && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => openModal('RUBRIC', { workflow: wf, milestone: m })}
                          >
                            {isEvaluated ? 'Re-Score Rubric' : 'Score Defense →'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
