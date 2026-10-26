import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const NewSubmissionModal = () => {
  const { closeModal, facultyList, handleCreateWorkflow } = useApp();

  const [category, setCategory] = useState('UG');
  const [type, setType] = useState('UG_PROJECT');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [proposedGuideId, setProposedGuideId] = useState(facultyList[0]?.id || 'FAC-03');
  const [abstract, setAbstract] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) return;

    setSubmitting(true);
    try {
      const guideObj = facultyList.find(f => f.id === proposedGuideId);
      await handleCreateWorkflow({
        category,
        type,
        title,
        domain: domain || 'General IT',
        proposedGuideId,
        allocatedGuideId: category === 'UG' ? null : proposedGuideId,
        guideName: guideObj ? guideObj.name : null,
        abstract
      });
      closeModal();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2>Submit New Project Proposal / Requisition</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Academic Track / Category:</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setCategory(cat);
                    setType(cat === 'UG' ? 'UG_PROJECT' : cat === 'PG' ? 'PG_DISSERTATION' : 'LAB_EQUIPMENT');
                  }}
                >
                  <option value="UG">UG (B.Tech Capstone Project)</option>
                  <option value="PG">PG (M.Tech Dissertation / Thesis)</option>
                  <option value="DEPARTMENTAL">Departmental / Lab Requisition</option>
                </select>
              </div>

              <div className="form-group">
                <label>Request Classification:</label>
                <select 
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {category === 'UG' && (
                    <>
                      <option value="UG_PROJECT">Capstone Project Proposal</option>
                      <option value="LEAVE_NOC">Industrial Training / Internship NOC</option>
                    </>
                  )}
                  {category === 'PG' && (
                    <>
                      <option value="PG_DISSERTATION">Dissertation Topic Clearance</option>
                      <option value="LEAVE_NOC">Industry Research / Conference NOC</option>
                    </>
                  )}
                  {category === 'DEPARTMENTAL' && (
                    <>
                      <option value="LAB_EQUIPMENT">Lab Hardware / Compute Requisition</option>
                      <option value="BUDGET_SANCTION">Grant Fund Sanction Request</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Project / Request Title:</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Zero-Knowledge Cryptography in Distributed Edge Networks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Specialization Domain:</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Artificial Intelligence, Cloud, IoT"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Faculty Guide:</label>
                <select 
                  className="form-control"
                  value={proposedGuideId}
                  onChange={(e) => setProposedGuideId(e.target.value)}
                >
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Abstract / Statement of Purpose:</label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="Describe the objective, methodology, literature review background and anticipated deliverables..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Dispatching...' : 'Dispatch Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
