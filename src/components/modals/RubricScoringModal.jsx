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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  1. Literature Survey & Problem Formulation (Max 30)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {litScore} / 30
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={litScore} 
                onChange={(e) => setLitScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            {/* Criterion 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  2. Technical Rigor & Mathematical Architecture (Max 40)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {rigorScore} / 40
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="40" 
                value={rigorScore} 
                onChange={(e) => setRigorScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            {/* Criterion 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  3. Viva Voce Demonstration & Q&A (Max 30)
                </span>
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {oralScore} / 30
                </strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={oralScore} 
                onChange={(e) => setOralScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>

          {/* Composite Score Card */}
          <div style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '1.25rem 0'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Composite Score:
              </div>
              <div id="rubricTotalDisplay" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                {totalScore} / 100
              </div>
            </div>
            <div>
              <span id="rubricGradeBadge" style={{ fontWeight: 700, fontSize: '0.95rem', color: gradeInfo.color }}>
                {gradeInfo.label}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Qualitative Examiner Feedback:</label>
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
            {submitting ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
};
