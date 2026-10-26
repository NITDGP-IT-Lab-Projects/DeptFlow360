import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const RubricScoringModal = ({ workflow, milestone }) => {
  const { closeModal, handleEvaluateMilestone } = useApp();

  const initialScores = milestone.rubricScores || {};
  const [litScore, setLitScore] = useState(initialScores.literatureSurvey ?? 26);
  const [rigorScore, setRigorScore] = useState(initialScores.rigorAndMath ?? 35);
  const [oralScore, setOralScore] = useState(initialScores.oralDefense ?? 27);
  const [feedback, setFeedback] = useState(milestone.feedback || '');
  const [submitting, setSubmitting] = useState(false);

  const totalScore = Number(litScore) + Number(rigorScore) + Number(oralScore);

  const getGradeInfo = (score) => {
    if (score >= 90) return { label: 'Outstanding (O / A+)', color: 'var(--status-approved)' };
    if (score >= 80) return { label: 'Excellent (E / A)', color: 'var(--status-approved)' };
    if (score >= 70) return { label: 'Very Good (B+)', color: 'var(--status-pending)' };
    if (score >= 60) return { label: 'Good (B)', color: 'var(--status-pending)' };
    return { label: 'Needs Remediation (F)', color: 'var(--status-rejected)' };
  };

  const gradeInfo = getGradeInfo(totalScore);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await handleEvaluateMilestone(
        workflow.id,
        milestone.id,
        {
          literatureSurvey: Number(litScore),
          rigorAndMath: Number(rigorScore),
          oralDefense: Number(oralScore)
        },
        feedback || 'Comprehensive milestone defense approved.'
      );
      closeModal();
    } catch {
      setSubmitting(false);
    }
  };

  const getTrackBackground = (val, max) => {
    const pct = (val / max) * 100;
    return `linear-gradient(to right, #6366f1 0%, #06b6d4 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h2 id="rubricModalTitle">Milestone Rubric Evaluation</h2>
            <div id="rubricModalSubtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              [{workflow.id}] {milestone.name} • {workflow.submittedBy?.name}
            </div>
          </div>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body">
          <div id="rubricCriteriaContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Criterion 1 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  1. Literature Survey & Problem Formulation (Max 30)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {litScore} / 30
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={litScore} 
                onChange={(e) => setLitScore(e.target.value)}
                style={{
                  background: getTrackBackground(litScore, 30),
                  height: '8px',
                  borderRadius: '999px'
                }}
              />
            </div>

            {/* Criterion 2 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  2. Technical Rigor & Mathematical Architecture (Max 40)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {rigorScore} / 40
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="40" 
                value={rigorScore} 
                onChange={(e) => setRigorScore(e.target.value)}
                style={{
                  background: getTrackBackground(rigorScore, 40),
                  height: '8px',
                  borderRadius: '999px'
                }}
              />
            </div>

            {/* Criterion 3 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  3. Viva Voce Demonstration & Q&A (Max 30)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {oralScore} / 30
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={oralScore} 
                onChange={(e) => setOralScore(e.target.value)}
                style={{
                  background: getTrackBackground(oralScore, 30),
                  height: '8px',
                  borderRadius: '999px'
                }}
              />
            </div>
          </div>

          {/* Composite Score Card with Fluid Grade Morph */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.06))',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--inner-highlight)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Composite ABET / NBA Outcome Score
              </div>
              <div id="rubricTotalDisplay" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {totalScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>
            <div>
              <span id="rubricGradeBadge" className="status-badge" style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: gradeInfo.color,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${gradeInfo.color}`,
                padding: '0.4rem 0.9rem'
              }}>
                {gradeInfo.label}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Qualitative Examiner Feedback & Defense Remarks:</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Provide constructive feedback on implementation quality, slide defense, and next steps..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button 
            type="button" 
            className="btn btn-success" 
            disabled={submitting}
            onClick={handleSave}
          >
            {submitting ? 'Committing...' : 'Commit Assessment Outcome'}
          </button>
        </div>
      </div>
    </div>
  );
};
