import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const ManualOverrideModal = ({ team }) => {
  const { closeModal, facultyList, handleManualOverride } = useApp();

  const [newFacultyId, setNewFacultyId] = useState(facultyList[0]?.id || 'FAC-01');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await handleManualOverride(team.teamId, newFacultyId, reason);
      closeModal();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2>Manual Guide Allotment Override</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div id="overrideTeamTitle" style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
              [{team.teamId}] {team.title} (Lead: {team.leadName})
            </div>

            <div className="form-group">
              <label>Reassign to Faculty Member:</label>
              <select 
                className="form-control"
                value={newFacultyId}
                onChange={(e) => setNewFacultyId(e.target.value)}
              >
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation}) — UG: {f.ugQuotaCurrent}/{f.ugQuotaMax}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Administrative Justification (Mandatory for Audit Trail):</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Provide reason: domain expertise synergy, quota rebalancing, student special request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Applying...' : 'Apply Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
