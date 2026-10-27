import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconScale,
  IconCheckCircle,
  IconClock,
  IconFileText,
  IconSliders
} from '../icons/Icons.jsx';

export const RubricEvalView = () => {
  const { workflows, facultyList, openModal, currentRoleKey, currentRoleData, currentUser, setActiveView } = useApp();

  const isStudent = currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT';
  const isFaculty = currentRoleKey === 'FACULTY';
  const isCoordinator = currentRoleKey === 'COORDINATOR';
  const isHOD = currentRoleKey === 'HOD';

  const canGrade = isFaculty || isCoordinator || isHOD;

  const myFacultyRecord = facultyList?.find(f => 
    f.id === currentRoleData?.id || 
    f.id === currentUser?.referenceId ||
    f.name === currentRoleData?.name ||
    f.email === currentUser?.email
  );
  const activeFacultyId = myFacultyRecord?.id || currentUser?.referenceId || currentRoleData?.id;

  // Evaluatable workflows strictly scoped to supervisor or departmental coordinators
  const evaluatableWorkflows = workflows.filter(w => {
    if (!w.milestones || w.milestones.length === 0) return false;
    if (isHOD || isCoordinator) return true;
    if (isFaculty) {
      return (
        w.details?.allocatedGuideId === activeFacultyId ||
        w.details?.proposedGuideId === activeFacultyId ||
        w.details?.allocatedGuideId === currentRoleData?.id ||
        w.details?.proposedGuideId === currentRoleData?.id ||
        (currentUser?.name && w.details?.guideName && w.details.guideName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (currentRoleData?.name && w.details?.guideName && w.details.guideName.toLowerCase().includes(currentRoleData.name.toLowerCase()))
      );
    }
    return false;
  });

  if (isStudent) {
    return (
      <div id="view-rubric_eval" className="view-section active">
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
            <IconScale size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Defense Scoring Station Restricted
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Continuous assessment scoring against ABET/NBA rubrics is restricted to appointed Faculty Guides and Defense Committee evaluators. You can review your awarded grades and feedback on your submissions desk.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => setActiveView('ugpg_desk')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Go to My Submissions Desk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="view-rubric_eval" className="view-section active">
      {/* Criteria Framework Summary */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="card-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconScale size={18} className="text-cyan" />
            <h2>Continuous Assessment Rubric Framework</h2>
          </div>
          <span className="live-pill">ABET / NBA Compliant Scoring</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Evaluations are computed across three standardized dimensions: 
          <strong> Literature Survey & Problem Formulation (30 pts)</strong>, 
          <strong> Technical Rigor & Mathematical Architecture (40 pts)</strong>, and 
          <strong> Viva Voce Demonstration & Q&A (30 pts)</strong>.
          Grades are computed dynamically based on total composite marks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Criterion 1 (30 pts)</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', margin: '4px 0' }}>Literature Review & SOTA</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Citation quality, problem gap clarity, benchmark metrics</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Criterion 2 (40 pts)</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', margin: '4px 0' }}>Methodology & Technical Rigor</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mathematical rigor, system architecture, modular software testing</div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Criterion 3 (30 pts)</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', margin: '4px 0' }}>Viva Voce & Demonstration</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="wf-id">{wf.id}</span>
                    <span className={`type-tag ${wf.category.toLowerCase()}`}>{wf.category}</span>
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '4px 0' }}>{wf.title}</h3>
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
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{m.name}</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Weightage: {m.weightage}% • Max Score: {m.maxScore || 100} • Target: {m.deadline}
                        </div>
                        {isEvaluated && m.feedback && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <em>"{m.feedback}"</em> — <span style={{ color: 'var(--accent-cyan)' }}>{m.evaluator}</span>
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
                              Grade: <strong>{m.grade || 'A'}</strong>
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Pending Defense
                          </span>
                        )}

                        {canGrade && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openModal('RUBRIC', { workflow: wf, milestone: m })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <IconSliders size={13} />
                            <span>{isEvaluated ? 'Re-Score' : 'Evaluate'}</span>
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
