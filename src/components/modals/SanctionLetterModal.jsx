import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const SanctionLetterModal = ({ workflow }) => {
  const { closeModal } = useApp();

  if (!workflow) return null;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const printLetter = () => {
    window.print();
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog wide">
        <div className="modal-header">
          <h2>Official Departmental Sanction Order</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc', color: '#0f172a', padding: '2.5rem', borderRadius: 'var(--radius-md)', fontFamily: 'serif' }}>
          <div id="sanctionLetterBody">
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Department of Information Technology
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                National Institute of Technology Durgapur • Mahatma Gandhi Avenue, Durgapur 713209
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Academic Year 2026–2027 • UG/PG Project Clearance Cell
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              <div><strong>Ref No:</strong> NITD/IT/SANCTION/2026/{workflow.id}</div>
              <div><strong>Date:</strong> {dateStr}</div>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 700, textAlign: 'center', textDecoration: 'underline', marginBottom: '1.5rem', color: '#0f172a' }}>
              MEMORANDUM / OFFICIAL SANCTION ORDER
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#1e293b', marginBottom: '1rem' }}>
              With reference to the project proposal submitted under tracking registration <strong>{workflow.id}</strong>, 
              the Departmental Academic Review Committee hereby accords official sanction and operational clearance for the project topic entitled:
            </p>

            <div style={{
              background: '#e2e8f0',
              padding: '1rem 1.25rem',
              borderRadius: '6px',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#0f172a',
              textAlign: 'center',
              borderLeft: '4px solid #4f46e5',
              marginBottom: '1.5rem'
            }}>
              "{workflow.title}"
            </div>

            <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: '#1e293b', marginBottom: '1.5rem' }}>
              <div><strong>Principal Submitter / Consortia:</strong> {workflow.submittedBy?.name} ({workflow.submittedBy?.rollNo || 'N/A'})</div>
              <div><strong>Academic Category:</strong> {workflow.category} ({workflow.type})</div>
              <div><strong>Specialization Domain:</strong> {workflow.details?.domain || 'General IT'}</div>
              <div><strong>Designated Faculty Supervisor:</strong> {workflow.details?.guideName || workflow.details?.allocatedGuideId || 'Dr. Vikramaditya Das'}</div>
              {workflow.details?.budgetEstimated && (
                <div><strong>Approved Budget Allocation:</strong> {workflow.details.budgetEstimated}</div>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '2rem' }}>
              The candidate(s) are directed to strictly adhere to the milestones framework prescribed under the ABET/NBA 
              Continuous Evaluation Rubrics. Any changes in software architecture or scope require prior written clearance from the Project Convener.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', color: '#0284c7', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', transform: 'rotate(-8deg)' }}>
                  OFFICIAL SEAL<br />NIT DURGAPUR<br />DEPT OF IT
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Departmental Registry</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontFamily: 'cursive', color: '#0f172a', marginBottom: '4px' }}>
                  Dr. Rajeshwar Sen
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Dr. Rajeshwar Sen</div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>Professor & Head of Department</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Digital Verification Signature Verified</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
          <button type="button" className="btn btn-primary" onClick={printLetter}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};
