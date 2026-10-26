import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  IconZap,
  IconRefresh,
  IconUsers,
  IconTarget,
  IconCheckCircle,
  IconAlertCircle,
  IconSliders
} from '../icons/Icons.jsx';

export const AllocationView = () => {
  const { 
    facultyList, 
    teamsList, 
    simulationLogs, 
    handleRunAllocation, 
    handleResetAllocations, 
    openModal,
    currentRoleKey 
  } = useApp();

  const canOverride = currentRoleKey === 'COORDINATOR' || currentRoleKey === 'HOD';

  return (
    <div id="view-allocation" className="view-section active">
      {/* Action Banner */}
      <div className="role-directive-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="live-pill">
              <span className="live-pill-dot"></span> Gale-Shapley Stable Matcher
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Polynomial Time Complexity O(N × M)</span>
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Priority & Preference-Based Project Allocation Engine
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Matches student project preferences against faculty supervision quotas using Gale-Shapley stable matching with merit weightage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleRunAllocation}
            id="btnRunAllocation"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <IconZap size={15} />
            <span>Run Automated Matcher</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleResetAllocations}
            id="btnResetAllocation"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <IconRefresh size={14} />
            <span>Revert Baseline</span>
          </button>
        </div>
      </div>

      {/* Simulation Console Output */}
      {simulationLogs && simulationLogs.length > 0 && (
        <div id="simulationConsoleOutput" className="simulation-console" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              </div>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                gale-shapley@deptflow360:~$ match --priority=cgpa --quotas=strict
              </span>
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              STATUS: OPTIMAL_STABLE
            </span>
          </div>
          {simulationLogs.map((log, index) => (
            <div key={index} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: log.includes('Match successful') ? '#4ade80' : log.includes('FULL') ? '#f59e0b' : '#cbd5e1', lineHeight: 1.6 }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Faculty Quotas Grid (Full Width, Uniform Cards) */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="card-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUsers size={18} className="text-cyan" />
            <h2>Faculty Supervisory Capacities & Quotas</h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UG / PG Load Constraints</span>
        </div>
        <div id="facultyQuotaList" className="faculty-quota-grid">
          {facultyList.map(faculty => {
            const ugPct = faculty.ugQuotaMax > 0 ? (faculty.ugQuotaCurrent / faculty.ugQuotaMax) * 100 : 0;
            const pgPct = faculty.pgQuotaMax > 0 ? (faculty.pgQuotaCurrent / faculty.pgQuotaMax) * 100 : 0;

            return (
              <div key={faculty.id} className="faculty-quota-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{faculty.name}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {faculty.designation} • {faculty.room}
                    </div>
                  </div>
                  <span className={`status-badge ${faculty.ugQuotaCurrent >= faculty.ugQuotaMax ? 'REJECTED' : 'APPROVED'}`}>
                    {faculty.ugQuotaCurrent >= faculty.ugQuotaMax ? 'Quota Full' : 'Available'}
                  </span>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>B.Tech Capstone Load (UG)</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{faculty.ugQuotaCurrent} / {faculty.ugQuotaMax} Slots</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className={`quota-bar-fill ${ugPct >= 100 ? 'full' : ugPct >= 66 ? 'warning' : ''}`}
                      style={{ width: `${Math.min(ugPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>M.Tech Thesis Load (PG)</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{faculty.pgQuotaCurrent} / {faculty.pgQuotaMax} Slots</strong>
                  </div>
                  <div className="quota-bar-track">
                    <div 
                      className="quota-bar-fill" 
                      style={{ width: `${Math.min(pgPct, 100)}%`, background: 'var(--accent-cyan)' }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Student Allocation Table (Spacious Full Width Panel) */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconTarget size={18} className="text-indigo" />
            <h2>Student Bidding & Allocation Matrix</h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Merit Precedence & Stable Matching Result</span>
        </div>
        <div className="table-responsive">
          <table className="data-table" style={{ minWidth: '820px' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Team ID / Lead</th>
                <th>Project Title & Domain</th>
                <th style={{ width: '100px' }}>Avg CGPA</th>
                <th style={{ width: '220px' }}>Guide Preferences</th>
                <th style={{ width: '180px' }}>Allocated Mentor</th>
                <th style={{ width: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody id="allocationTeamsTableBody">
              {teamsList.map(team => {
                const guide = facultyList.find(f => f.id === team.allocatedGuideId);

                return (
                  <tr key={team.teamId}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{team.teamId}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Lead: {team.leadName}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>{team.title}</div>
                      <span className="type-tag" style={{ fontSize: '0.68rem', marginTop: '3px', display: 'inline-block' }}>
                        {team.domain}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {team.avgCgpa ? team.avgCgpa.toFixed(2) : 'N/A'}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {team.preferences && team.preferences.map((p, idx) => (
                          <span 
                            key={idx} 
                            className="type-tag"
                            title={`Preference #${idx + 1}`}
                            style={{ 
                              background: p === team.allocatedGuideId ? '#ecfdf5' : '#f1f5f9',
                              border: p === team.allocatedGuideId ? '1px solid #a7f3d0' : '1px solid var(--border-subtle)',
                              color: p === team.allocatedGuideId ? '#065f46' : 'var(--text-secondary)',
                              fontWeight: p === team.allocatedGuideId ? 700 : 500
                            }}
                          >
                            #{idx + 1}: {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {guide ? (
                        <div>
                          <span className="status-badge APPROVED" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheckCircle size={12} />
                            <span>{guide.name}</span>
                          </span>
                          {team.overrideAudit && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--status-pending)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <IconAlertCircle size={11} />
                              <span>Manually Reassigned</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="status-badge REJECTED" style={{ fontSize: '0.75rem' }}>
                          Unallocated
                        </span>
                      )}
                    </td>
                    <td>
                      {canOverride ? (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openModal('OVERRIDE', team)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <IconSliders size={12} />
                          <span>Reassign</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Read-Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
