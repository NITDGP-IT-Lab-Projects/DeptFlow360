import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconUsers,
  IconMapPin,
  IconMail
} from '../icons/Icons.jsx';

export const FacultyDirView = () => {
  const { facultyList, teamsList } = useApp();

  return (
    <div id="view-faculty_dir" className="view-section active">
      <div id="facultyDirectoryGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {facultyList.map(faculty => {
          const supervisedTeams = teamsList.filter(t => t.allocatedGuideId === faculty.id);
          const ugPct = faculty.ugQuotaMax > 0 ? (faculty.ugQuotaCurrent / faculty.ugQuotaMax) * 100 : 0;
          const pgPct = faculty.pgQuotaMax > 0 ? (faculty.pgQuotaCurrent / faculty.pgQuotaMax) * 100 : 0;

          // Generate initials
          const initials = faculty.name
            .split(' ')
            .filter(n => !n.startsWith('Dr.'))
            .map(n => n[0])
            .join('')
            .slice(0, 2) || 'FC';

          return (
            <div key={faculty.id} className="card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="faculty-avatar-monogram">
                  {initials}
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: 0 }}>{faculty.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{faculty.designation}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <IconMapPin size={12} /> {faculty.room}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <IconMail size={12} /> {faculty.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Research Domains
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {faculty.specializations && faculty.specializations.map((spec, idx) => (
                    <span key={idx} className="type-tag" style={{ fontSize: '0.7rem' }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quotas */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>UG Capstone Slots</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{faculty.ugQuotaCurrent} / {faculty.ugQuotaMax}</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className={`quota-bar-fill ${ugPct >= 100 ? 'full' : ugPct >= 66 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(ugPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>PG Thesis Slots</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{faculty.pgQuotaCurrent} / {faculty.pgQuotaMax}</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className="quota-bar-fill" 
                      style={{ width: `${Math.min(pgPct, 100)}%`, background: 'var(--accent-cyan)' }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Supervised Roster */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Current Supervised Teams ({supervisedTeams.length})
                </div>
                {supervisedTeams.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No teams currently allocated
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {supervisedTeams.map(t => (
                      <div 
                        key={t.teamId} 
                        style={{
                          background: '#f8fafc',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.76rem',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{t.teamId}</strong>: {t.title}
                        </div>
                        <span className="type-tag ug" style={{ fontSize: '0.65rem' }}>{t.domain}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
