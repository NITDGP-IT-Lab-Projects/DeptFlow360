import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const WorkflowDetailModal = ({ workflow }) => {
  const { closeModal, openModal, currentRoleKey, currentRoleData, currentUser, facultyList, handleWorkflowTransition } = useApp();
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Editable revision fields
  const [editTitle, setEditTitle] = useState(workflow?.title || '');
  const [editDomain, setEditDomain] = useState(workflow?.details?.domain || '');
  const [editAbstract, setEditAbstract] = useState(workflow?.details?.abstract || workflow?.details?.purpose || '');
  const [editGuideId, setEditGuideId] = useState(workflow?.details?.proposedGuideId || facultyList?.[0]?.id || '');

  const sortedFaculty = useMemo(() => {
    return [...(facultyList || [])].sort((a, b) => {
      if (a.role === 'FACULTY' && b.role !== 'FACULTY') return -1;
      if (b.role === 'FACULTY' && a.role !== 'FACULTY') return 1;
      return 0;
    });
  }, [facultyList]);

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
  let hierarchyLockoutMessage = null;

  if (currentRoleKey === 'HOD') {
    if (workflow.state === 'UNDER_HOD_REVIEW') {
      availableActions.push(
        { key: 'HOD_APPROVE', label: 'Sanction & Sign Off', variant: 'success' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    } else if (workflow.state === 'UNDER_GUIDE_REVIEW') {
      hierarchyLockoutMessage = 'Awaiting Tier-1 Faculty Guide Review: The HOD cannot review or sanction before the proposal is reviewed and endorsed by the faculty guide and coordinator.';
    } else if (workflow.state === 'UNDER_COORDINATOR_REVIEW') {
      hierarchyLockoutMessage = 'Awaiting Tier-2 Coordinator Verification: The HOD cannot review or sanction before the proposal has been verified and forwarded by the project coordinator.';
    }
  } else if (currentRoleKey === 'COORDINATOR') {
    if (workflow.state === 'UNDER_COORDINATOR_REVIEW') {
      availableActions.push(
        { key: 'COORDINATOR_VERIFY', label: 'Verify & Forward to HOD', variant: 'primary' },
        { key: 'REQUEST_REVISION', label: 'Request Revision', variant: 'warning' },
        { key: 'REJECT', label: 'Reject Proposal', variant: 'danger' }
      );
    } else if (workflow.state === 'UNDER_GUIDE_REVIEW') {
      hierarchyLockoutMessage = 'Awaiting Tier-1 Faculty Guide Review: The coordinator cannot review, expedite, or forward before the proposal is reviewed and endorsed by the designated faculty guide.';
    } else if (workflow.state === 'UNDER_HOD_REVIEW') {
      hierarchyLockoutMessage = 'Proposal has been verified and forwarded to HOD for final sanction.';
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
  } else if (currentRoleKey === 'FACULTY' && (workflow.state === 'UNDER_COORDINATOR_REVIEW' || workflow.state === 'UNDER_HOD_REVIEW')) {
    hierarchyLockoutMessage = 'Proposal has been endorsed and is currently undergoing administrative verification by the project coordinator / HOD.';
  } else if (isStudent && workflow.state === 'REVISION_REQUESTED') {
    if (isMySubmission) {
      availableActions.push(
        { key: 'STUDENT_RESUBMIT', label: 'Submit Revised Proposal & Re-enter Clearance Chain', variant: 'primary' }
      );
    }
  }

  const handleActionClick = async (actionType) => {
    setSubmitting(true);
    try {
      let extraPayload = {};
      if (actionType === 'STUDENT_RESUBMIT') {
        const guideObj = sortedFaculty.find(f => f.id === editGuideId);
        extraPayload = {
          title: editTitle.trim(),
          domain: editDomain.trim(),
          abstract: editAbstract.trim(),
          proposedGuideId: editGuideId,
          guideName: guideObj ? guideObj.name : workflow.details?.guideName
        };
      }
      await handleWorkflowTransition(workflow.id, actionType, remarks, extraPayload);
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
          {workflow.state === 'REVISION_REQUESTED' && isMySubmission ? (
            /* Student Proposal Revision & Resubmission Mode */
            <div>
              {/* Alert Banner */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
                    Revision Required — Update Proposal & Re-enter Approval Chain
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#b45309', lineHeight: 1.5 }}>
                    An academic reviewer requested amendments. Inspect the review comments below in the Audit Ledger, make the necessary revisions to your project details, and dispatch your revision. The proposal will re-enter the clearance chain at Guide Review.
                  </div>
                </div>
              </div>

              {/* Reviewer Feedback / Chronological Audit Ledger First */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Reviewer Feedback & Chronological Audit Ledger
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
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: h.action === 'REVISION_REQUESTED' ? 600 : 400 }}>
                          {h.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Proposal Fields */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Edit Proposal Details
                </h4>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                    Project Title:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                      Specialization Domain:
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                      Preferred Faculty Guide:
                    </label>
                    <select 
                      className="form-control"
                      value={editGuideId}
                      onChange={(e) => setEditGuideId(e.target.value)}
                    >
                      {sortedFaculty.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.designation} - {f.role === 'FACULTY' ? 'Faculty Guide' : f.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                    Revised Abstract / Statement of Purpose:
                  </label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={editAbstract}
                    onChange={(e) => setEditAbstract(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                    Summary of Changes Made (Audit Note):
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Addressed reviewer feedback, updated methodology and citations..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    disabled={submitting || !editTitle.trim() || !editAbstract.trim()}
                    onClick={() => handleActionClick('STUDENT_RESUBMIT')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                  >
                    {submitting ? 'Submitting Revision...' : '🚀 Submit Revised Proposal & Re-enter Approval Chain'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Inspector & Review Mode */
            <div>
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
                      This proposal requires amendments before proceeding through the departmental clearance chain.
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

              {/* Sequential Review Hierarchy Lockout Alert */}
              {hierarchyLockoutMessage && (
                <div style={{
                  marginTop: '1rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⏳</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>
                      Sequential Review Clearance Locked
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px', lineHeight: 1.4 }}>
                      {hierarchyLockoutMessage}
                    </div>
                  </div>
                </div>
              )}

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
                    {`Authority Clearance Controls (${currentRoleData.title || currentRoleKey})`}
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
