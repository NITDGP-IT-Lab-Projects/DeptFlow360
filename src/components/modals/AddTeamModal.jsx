import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { IconLayers, IconCheckCircle, IconAlertCircle } from '../icons/Icons.jsx';

export const AddTeamModal = () => {
  const { closeModal, facultyList, handleAddTeam } = useApp();

  const [type, setType] = useState('UG');
  const [title, setTitle] = useState('');
  const [leadName, setLeadName] = useState('');
  const [members, setMembers] = useState('');
  const [avgCgpa, setAvgCgpa] = useState('');
  const [domain, setDomain] = useState('');
  const [pref1, setPref1] = useState(facultyList[0]?.id || '');
  const [pref2, setPref2] = useState(facultyList[1]?.id || facultyList[0]?.id || '');
  const [pref3, setPref3] = useState(facultyList[2]?.id || facultyList[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim() || !leadName.trim()) {
      setErrorMsg('Project title and student lead name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const preferences = [pref1, pref2, pref3].filter(Boolean);
      const parsedMembers = members
        ? members.split(',').map(m => m.trim()).filter(Boolean)
        : [leadName.trim()];

      if (!parsedMembers.includes(leadName.trim())) {
        parsedMembers.unshift(leadName.trim());
      }

      await handleAddTeam({
        type,
        title: title.trim(),
        leadName: leadName.trim(),
        members: parsedMembers,
        avgCgpa: Number(avgCgpa) || 8.0,
        domain: domain.trim() || 'Information Technology',
        preferences,
        status: 'UNALLOCATED'
      });
      closeModal();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register team.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog" style={{ maxWidth: '540px' }}>
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
              <IconLayers size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Register Capstone / Thesis Team</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Add a new project team with ranked guide preferences into the allocation pool
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

            <div className="form-row">
              <div className="form-group">
                <label>Academic Track:</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="UG">UG (B.Tech Capstone Project)</option>
                  <option value="PG">PG (M.Tech Dissertation Scholar)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cumulative CGPA (Merit Score):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-control"
                  value={avgCgpa}
                  onChange={(e) => setAvgCgpa(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Project / Dissertation Title:</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Real-Time Autonomous Navigation on Low-Compute Microcontrollers"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Team Lead / Scholar Name:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Verma"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Research / Engineering Domain:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Edge AI, Computer Vision"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
              </div>
            </div>

            {type === 'UG' && (
              <div className="form-group">
                <label>Team Members (comma-separated):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Verma, Priya Das, Aman Singh"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                />
              </div>
            )}

            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem'
            }}>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                marginBottom: '8px'
              }}>
                Ranked Faculty Guide Preferences
              </div>

              {facultyList.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No faculty registered in directory yet. You can register this team now and run matching once faculty mentors are added.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-row" style={{ margin: 0 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.72rem' }}>Choice #1 (Highest Priority):</label>
                      <select
                        className="form-control"
                        value={pref1}
                        onChange={(e) => setPref1(e.target.value)}
                      >
                        <option value="">Select Mentor...</option>
                        {facultyList.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.72rem' }}>Choice #2:</label>
                      <select
                        className="form-control"
                        value={pref2}
                        onChange={(e) => setPref2(e.target.value)}
                      >
                        <option value="">Select Mentor...</option>
                        {facultyList.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.72rem' }}>Choice #3:</label>
                    <select
                      className="form-control"
                      value={pref3}
                      onChange={(e) => setPref3(e.target.value)}
                    >
                      <option value="">Select Mentor...</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Project Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
