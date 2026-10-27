import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { IconUsers, IconCheckCircle, IconAlertCircle } from '../icons/Icons.jsx';

export const AddFacultyModal = () => {
  const { closeModal, handleAddFaculty } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('FACULTY');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specializations, setSpecializations] = useState('Machine Learning, Distributed Systems');
  const [ugQuotaMax, setUgQuotaMax] = useState(3);
  const [pgQuotaMax, setPgQuotaMax] = useState(2);
  const [room, setRoom] = useState('IT Block Room 302');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      await handleAddFaculty({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        designation: designation.trim(),
        specializations: specializations.split(',').map(s => s.trim()).filter(Boolean),
        ugQuotaMax: Number(ugQuotaMax) || 3,
        pgQuotaMax: Number(pgQuotaMax) || 2,
        room: room.trim() || 'IT Block',
        avatar: role === 'HOD' ? '👨‍💼' : role === 'COORDINATOR' ? '👩‍🏫' : '👨‍🏫'
      });
      closeModal();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add faculty member.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: '#eef2ff',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconUsers size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Add Faculty Member</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Register a new academic guide or administrator into the departmental directory
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ gap: '1rem' }}>
            {errorMsg && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconAlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dr. Rajeshwar Sen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Institutional Email:</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. r.sen@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department Role:</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setRole(r);
                    if (r === 'HOD') setDesignation('Professor & Head of Department');
                    else if (r === 'COORDINATOR') setDesignation('Associate Professor (Coordinator)');
                    else setDesignation('Assistant Professor');
                  }}
                >
                  <option value="FACULTY">Faculty Member / Guide</option>
                  <option value="COORDINATOR">Project Coordinator</option>
                  <option value="HOD">Head of Department (HOD)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Designation Title:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Associate Professor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Research Areas / Specializations (comma-separated):</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Artificial Intelligence, Cryptography, Cloud Computing"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max UG Capstone Quota:</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="form-control"
                  value={ugQuotaMax}
                  onChange={(e) => setUgQuotaMax(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Max PG Thesis Quota:</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="form-control"
                  value={pgQuotaMax}
                  onChange={(e) => setPgQuotaMax(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Office / Lab Room:</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. IT Block Room 302"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add to Faculty Directory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
