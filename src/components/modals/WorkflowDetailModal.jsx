import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const WorkflowDetailModal = ({ workflow }) => {
  const { closeModal, openModal, currentRoleKey, currentRoleData, currentUser, handleWorkflowTransition } = useApp();
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!workflow) return null;

  const isStudent = currentRoleKey === 'UG_STUDENT' || currentRoleKey === 'PG_STUDENT';
  const isMySubmission = (
    (currentRoleData?.id && workflow.submittedBy?.id === currentRoleData.id) || 
    (currentUser?.id && workflow.submittedBy?.id === currentUser.id) ||
    (currentUser?.email && workflow.submittedBy?.email && workflow.submittedBy.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && workflow.submittedBy?.name && workflow.submittedBy.name.toLowerCase().includes(currentUser.name.toLowerCase())) ||
    (workflow.submittedBy?.teamMembers && Array.isArray(workflow.submittedBy.teamMembers) && currentUser?.name && workflow.submittedBy.teamMembers.some(m => typeof m === 'string' && m.toLowerCase().includes(currentUser.name.toLowerCase()))) ||
    (isStudent && (workflow.submittedBy?.id === 'STUDENT-TEMP' || workflow.submittedBy?.email === 'student@university.edu'))
  );

  // Data isolation: Block students from inspecting proposals of other students
  if (isStudent && !isMySubmission) {
    return (
      <div className="modal-overlay active">
        <div className="modal-dialog">
          <div className="modal-header">
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Access Denied</h2>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{ color: 'var(--status-rejected)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
              Confidential Submission Track
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
              You do not have authorization to view this submission. Academic privacy controls restrict each student to their own submissions.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Stepper state representation
  const steps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'GUIDE', label: 'Guide Review' },
    { key: 'COORDINATOR', label: 'Coordinator' },
    { key: 'HOD', label: 'HOD Sanction' }
  ];

  let currentStepIdx = 0;
  if (workflow.state === 'UNDER_GUIDE_REVIEW') currentStepIdx = 1;
  else if (workflow.state === 'UNDER_COORDINATOR_REVIEW') currentStepIdx = 2;
  else if (workflow.state === 'UNDER_HOD_REVIEW') currentStepIdx = 3;
  else if (workflow.state === 'APPROVED') currentStepIdx = 4;

  // Determine allowed actions based on current role and state
  const availableActions = [];

  if (currentRoleKey === 'HOD') {
    if (workflow.state === 'UNDER_HOD_REVIEW') {
      availableActions.push(
        { key: 'HOD_APPROVE', label: 'Sanction & Sign Off', variant: 'success' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    } else if (workflow.state === 'UNDER_COORDINATOR_REVIEW' || workflow.state === 'UNDER_GUIDE_REVIEW') {
      availableActions.push(
        { key: 'HOD_APPROVE', label: 'Sanction & Sign Off (HOD Override)', variant: 'success' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    }
  } else if (currentRoleKey === 'COORDINATOR') {
    if (workflow.state === 'UNDER_COORDINATOR_REVIEW') {
      availableActions.push(
        { key: 'COORDINATOR_VERIFY', label: 'Verify & Forward to HOD', variant: 'primary' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    } else if (workflow.state === 'UNDER_GUIDE_REVIEW') {
      availableActions.push(
        { key: 'GUIDE_ENDORSE', label: 'Endorse as Guide & Forward', variant: 'primary' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    }
  } else if (currentRoleKey === 'FACULTY' && workflow.state === 'UNDER_GUIDE_REVIEW') {
    const isProposedGuide = workflow.details?.proposedGuideId === currentRoleData.id || 
                            workflow.details?.allocatedGuideId === currentRoleData.id ||
                            (currentRoleData?.name && workflow.details?.guideName && workflow.details.guideName.toLowerCase().includes(currentRoleData.name.toLowerCase()));
    availableActions.push(
      { key: 'GUIDE_ENDORSE', label: isProposedGuide ? 'Endorse & Forward to Coordinator' : 'Accept Mentorship & Endorse', variant: 'primary' },
      { key: 'REQUEST_REVISION', label: 'Request Revisions', variant: 'warning' },
      { key: 'REJECT', label: 'Decline Mentorship', variant: 'danger' }
    );
  } else if (isStudent && workflow.state === 'REVISION_REQUESTED') {
    if (isMySubmission) {
      availableActions.push(
        { key: 'STUDENT_RESUBMIT', label: 'Submit Revised Proposal', variant: 'primary' }
      );
    }
  }

  const handleActionClick = async (actionType) => {
    setSubmitting(true);
    try {
      await handleWorkflowTransition(workflow.id, actionType, remarks);
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
            <h2 id="modalWfTitle" style={{ color: 'var(--text-primary)', fontSize: '1.15rem', marginTop: '2px' }}>
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
          {workflow.state === 'REVISION_REQUESTED' && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
                  Revision Required by Academic Authority
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b45309', lineHeight: 1.4 }}>
                  This proposal requires amendments before proceeding through the departmental clearance chain. Check the reviewer comments in the Chronological Audit Ledger below, make required changes, and submit your revision.
                </div>
              </div>
            </div>
          )}

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
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Principal Submitter
              </div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
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
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {workflow.details?.guideName || workflow.details?.allocatedGuideId || 'Pending'}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                SLA Clearance Window
              </div>
              <strong style={{ fontSize: '0.85rem', color: workflow.slaDaysRemaining <= 2 ? 'var(--status-rejected)' : 'var(--text-primary)' }}>
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
              background: '#f8fafc',
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
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Chronological Audit & Review Ledger
            </h4>
            <div className="audit-timeline">
              {workflow.history && workflow.history.map((h, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-icon">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block' }}></span>
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{h.action}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 500 }}>
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
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isStudent ? 'Submit Revised Proposal for Academic Re-evaluation' : `Authority Clearance Controls (${currentRoleData.title})`}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={isStudent ? "Describe revisions and updates made to this proposal..." : "Enter remarks or justification comments for the permanent audit trail..."}
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
          {workflow.state === 'APPROVED' && (
            <button 
              className="btn btn-primary"
              onClick={() => openModal('SANCTION', workflow)}
            >
              📄 View Sanction Letter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
