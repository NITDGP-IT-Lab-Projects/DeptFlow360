import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const RubricScoringModal = ({ workflow: propWf, milestone: propMs, data }) => {
  const { closeModal, handleEvaluateMilestone, handleScoreMilestone } = useApp();

  const workflow = propWf || data?.workflow;
  const milestone = propMs || data?.milestone;

  const [litScore, setLitScore] = useState(25);
  const [rigorScore, setRigorScore] = useState(35);
  const [oralScore, setOralScore] = useState(26);
  const [feedback, setFeedback] = useState('Satisfactory demonstration. Good mathematical rigor and prototype implementation.');
  const [submitting, setSubmitting] = useState(false);

  if (!workflow || !milestone) return null;

  const totalScore = Number(litScore) + Number(rigorScore) + Number(oralScore);

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'O', label: 'Outstanding', cls: 'APPROVED' };
    if (score >= 80) return { grade: 'E', label: 'Excellent', cls: 'APPROVED' };
    if (score >= 70) return { grade: 'A', label: 'Very Good', cls: 'UNDER_COORDINATOR_REVIEW' };
    if (score >= 60) return { grade: 'B', label: 'Good', cls: 'UNDER_GUIDE_REVIEW' };
    if (score >= 50) return { grade: 'C', label: 'Satisfactory', cls: 'UNDER_HOD_REVIEW' };
    return { grade: 'F', label: 'Failed Defense', cls: 'REJECTED' };
  };

  const gradeInfo = getGrade(totalScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const evalFn = handleEvaluateMilestone || handleScoreMilestone;
      if (evalFn) {
        await evalFn(
          workflow.id, 
          milestone.id, 
          {
            literatureSurvey: Number(litScore),
            rigorAndMath: Number(rigorScore),
            oralDefense: Number(oralScore)
          }, 
          feedback
        );
      }
      closeModal();
    } catch {
      setSubmitting(false);
    }
  };

  const getTrackBackground = (val, max) => {
    const pct = (val / max) * 100;
    return `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h2>Continuous Assessment Defense Station</h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Evaluating [{workflow.id}]: {milestone.name}
            </div>
          </div>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body">
          <div id="rubricCriteriaContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Criterion 1 */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Composite ABET / NBA Outcome Score
              </div>
              <div id="rubricTotalDisplay" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {totalScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>
            <div>
              <span id="rubricGradeBadge" className={`status-badge ${gradeInfo.cls}`} style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '0.35rem 0.85rem'
              }}>
                Grade: {gradeInfo.grade} ({gradeInfo.label})
              </span>
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="form-group">
            <label>Evaluator Feedback & Defense Comments:</label>
            <textarea 
              className="form-control"
              rows="3"
              id="rubricFeedbackInput"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Record defense observations, architectural recommendations, and viva questions..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button 
            className="btn btn-primary"
            id="btnSaveRubricScore"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Recording Score...' : 'Submit & Seal Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};
