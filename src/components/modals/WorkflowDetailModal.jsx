import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const WorkflowDetailModal = ({ workflow }) => {
  const { 
    closeModal, 
    openModal, 
    currentRoleKey, 
    currentRoleData, 
    handleTransition 
  } = useApp();

  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!workflow) return null;

  const steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'UNDER_GUIDE_REVIEW', label: 'Guide Review' },
    { key: 'UNDER_COORDINATOR_REVIEW', label: 'Coordinator' },
    { key: 'UNDER_HOD_REVIEW', label: 'HOD Sanction' },
    { key: 'APPROVED', label: 'Approved' }
  ];

  const getCurrentStepIndex = () => {
    if (workflow.state === 'REJECTED') return -1;
    if (workflow.state === 'REVISION_REQUESTED') return 1;
    const idx = steps.findIndex(s => s.key === workflow.state);
    return idx !== -1 ? idx : 0;
  };

  const currentStepIdx = getCurrentStepIndex();

  const getAvailableActions = () => {
    const actions = [];
    const state = workflow.state;

    // Student
    if ((currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT') && 
        workflow.submittedBy?.id === currentRoleData.id) {
      if (state === 'DRAFT' || state === 'REVISION_REQUESTED') {
        actions.push({ key: 'RESUBMIT', label: 'Resubmit with Changes', variant: 'primary' });
      }
      return actions;
    }

    // Faculty
    if (currentRoleKey === 'FACULTY') {
      const isGuide = (workflow.details?.allocatedGuideId === currentRoleData.id || 
                       workflow.details?.proposedGuideId === currentRoleData.id);
      if (state === 'UNDER_GUIDE_REVIEW' && isGuide) {
        actions.push({ key: 'GUIDE_ENDORSE', label: 'Endorse & Forward to Coordinator', variant: 'success' });
        actions.push({ key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' });
        actions.push({ key: 'REJECT', label: 'Reject Proposal', variant: 'danger' });
      }
      return actions;
    }

    // Coordinator
    if (currentRoleKey === 'COORDINATOR') {
      if (state === 'UNDER_COORDINATOR_REVIEW') {
        actions.push({ key: 'COORDINATOR_VERIFY', label: 'Verify Quotas & Forward to HOD', variant: 'success' });
        actions.push({ key: 'REQUEST_REVISION', label: 'Send Back for Revision', variant: 'warning' });
        actions.push({ key: 'REJECT', label: 'Reject Proposal', variant: 'danger' });
      } else if (state === 'UNDER_GUIDE_REVIEW') {
        actions.push({ key: 'COORDINATOR_EXPEDITE', label: 'Expedite Guide Review', variant: 'neutral' });
      }
      return actions;
    }

    // HOD
    if (currentRoleKey === 'HOD') {
      if (state === 'UNDER_HOD_REVIEW') {
        actions.push({ key: 'HOD_APPROVE', label: 'Grant Final HOD Sanction', variant: 'success' });
        actions.push({ key: 'REQUEST_REVISION', label: 'Remand to Coordinator / Guide', variant: 'warning' });
        actions.push({ key: 'REJECT', label: 'Reject Application', variant: 'danger' });
      } else if (state === 'APPROVED') {
        actions.push({ key: 'GENERATE_SANCTION_LETTER', label: 'Export Official Sanction Order', variant: 'neutral' });
      }
      return actions;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  const handleActionClick = async (actionKey) => {
    if (actionKey === 'GENERATE_SANCTION_LETTER') {
      openModal('SANCTION', workflow);
      return;
    }

    setSubmitting(true);
    try {
      await handleTransition(workflow.id, actionKey, remarks);
      closeModal();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog wide">
        <div className="modal-header">
          <div>
            <span className="wf-id" id="modalWfId">{workflow.id}</span>
            <h2 id="modalWfTitle" style={{ color: '#fff', fontSize: '1.15rem', marginTop: '2px' }}>
              {workflow.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`status-badge ${workflow.state}`}>
              {workflow.state}
            </span>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Stepper Progress */}
          <div className="stepper-container" style={{ margin: '0.5rem 0 1.5rem 0' }}>
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx > idx || workflow.state === 'APPROVED';
              const isCurrent = currentStepIdx === idx && workflow.state !== 'APPROVED';

              return (
                <div 
                  key={step.key} 
                  className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                >
                  <div className="step-circle">
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            background: '#10121a',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Principal Submitter
              </div>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                {workflow.submittedBy?.name || 'N/A'}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Domain Track
              </div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                {workflow.details?.domain || 'General'}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Faculty Guide
              </div>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                {workflow.details?.guideName || workflow.details?.allocatedGuideId || 'Pending'}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                SLA Clearance Window
              </div>
              <strong style={{ fontSize: '0.85rem', color: workflow.slaDaysRemaining <= 2 ? 'var(--status-rejected)' : '#fff' }}>
                {workflow.slaDaysRemaining} Days Remaining
              </strong>
            </div>
          </div>

          {/* Abstract Box */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Proposal Abstract / Statement of Purpose
            </h4>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              background: '#0c0d12',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              margin: 0
            }}>
              {workflow.details?.abstract || workflow.details?.purpose || 'No description provided.'}
            </p>
          </div>

          {/* Chronological Audit Ledger */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
              Chronological Audit & Review Ledger
            </h4>
            <div className="audit-timeline">
              {workflow.history && workflow.history.map((h, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-icon">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}></span>
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#fff' }}>{h.action}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                      {h.actorName} ({h.actorRole})
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {h.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Action Controls based on Role */}
          {availableActions.length > 0 && (
            <div style={{
              marginTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              background: '#161924',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                Authority Clearance Controls ({currentRoleData.title})
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter remarks or justification comments for the permanent audit trail..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {availableActions.map(act => (
                  <button 
                    key={act.key}
                    className={`btn btn-${act.variant === 'danger' ? 'danger' : act.variant === 'warning' ? 'warning' : act.variant === 'success' ? 'success' : 'primary'}`}
                    disabled={submitting}
                    onClick={() => handleActionClick(act.key)}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>Close</button>
          <button 
            className="btn btn-primary"
            onClick={() => openModal('SANCTION', workflow)}
          >
            📄 Generate Sanction Letter
          </button>
        </div>
      </div>
    </div>
  );
};
