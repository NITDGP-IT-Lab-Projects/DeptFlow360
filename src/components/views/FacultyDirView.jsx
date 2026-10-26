import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export const FacultyDirView = () => {
  const { facultyList, teamsList } = useApp();

  return (
    <div id="view-faculty_dir" className="view-section active">
      <div id="facultyDirectoryGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {facultyList.map(faculty => {
          const supervisedTeams = teamsList.filter(t => t.allocatedGuideId === faculty.id);
          const ugPct = faculty.ugQuotaMax > 0 ? (faculty.ugQuotaCurrent / faculty.ugQuotaMax) * 100 : 0;
          const pgPct = faculty.pgQuotaMax > 0 ? (faculty.pgQuotaCurrent / faculty.pgQuotaMax) * 100 : 0;

          return (
            <div key={faculty.id} className="card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2.4rem' }}>{faculty.avatar || '👨‍🏫'}</div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: 0 }}>{faculty.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{faculty.designation}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {faculty.room} • ✉️ {faculty.email}</div>
                </div>
              </div>

              {/* Specializations */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Research Domains
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {faculty.specializations && faculty.specializations.map((spec, idx) => (
                    <span key={idx} className="type-tag" style={{ fontSize: '0.7rem' }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quotas */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>UG Capstone Slots</span>
                    <strong style={{ color: '#fff' }}>{faculty.ugQuotaCurrent} / {faculty.ugQuotaMax}</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className={`quota-bar-fill ${ugPct >= 100 ? 'full' : ugPct >= 66 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(ugPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>PG Thesis Slots</span>
                    <strong style={{ color: '#fff' }}>{faculty.pgQuotaCurrent} / {faculty.pgQuotaMax}</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className="quota-bar-fill" 
                      style={{ width: `${Math.min(pgPct, 100)}%`, background: 'var(--accent-cyan)' }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Allocated Teams */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Supervised Scholars ({supervisedTeams.length})
                </div>
                {supervisedTeams.length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No candidates currently assigned
                  </span>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {supervisedTeams.map(t => (
                      <li 
                        key={t.teamId}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <strong style={{ color: '#fff' }}>[{t.teamId}]</strong> {t.leadName} — <em>{t.title.substring(0, 45)}...</em>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
