/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Unit Test Suite for AllocationEngine (Gale-Shapley / Priority Matching)
 * Run with: node --test tests/allocationEngine.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const {
  INITIAL_FACULTY,
  INITIAL_PROJECT_TEAMS,
  DeptStore
} = require('../js/data.js');

const { AllocationEngine } = require('../js/allocationEngine.js');

describe('AllocationEngine Tests', () => {
  let engine;

  beforeEach(() => {
    DeptStore.reset();
    engine = new AllocationEngine(DeptStore);
  });

  it('should initialize with faculty quotas and project teams', () => {
    const faculty = engine.getFacultyList();
    const teams = engine.getTeams();

    assert.ok(Array.isArray(faculty));
    assert.strictEqual(faculty.length, 5);
    assert.ok(Array.isArray(teams));
    assert.strictEqual(teams.length, 8);
  });

  it('should calculate live quotas accurately based on assignments', () => {
    const quotas = engine.calculateQuotas();
    assert.ok(quotas['FAC-01']);
    assert.ok(quotas['FAC-02']);
    assert.ok(quotas['FAC-03']);

    // Check that current counters match assigned teams
    const teams = engine.getTeams();
    const fac3UgTeams = teams.filter(t => t.allocatedGuideId === 'FAC-03' && t.type === 'UG').length;
    assert.strictEqual(quotas['FAC-03'].ugCurrent, fac3UgTeams);
  });

  it('should execute automated Gale-Shapley matching without exceeding faculty quotas', () => {
    const result = engine.runAutomatedMatching();

    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.logs));
    assert.ok(result.logs.length > 0);

    const updatedTeams = engine.getTeams();
    const faculty = engine.getFacultyList();

    // Verify all teams have an allocated guide
    updatedTeams.forEach(team => {
      assert.ok(team.allocatedGuideId !== null, `Team ${team.teamId} should be allocated a guide`);
      assert.strictEqual(team.status, 'ALLOCATED');
    });

    // Verify hard capacity bounds: no faculty exceeds their ugQuotaMax or pgQuotaMax
    const quotaMap = engine.calculateQuotas();
    faculty.forEach(f => {
      assert.ok(
        quotaMap[f.id].ugCurrent <= f.ugQuotaMax,
        `Faculty ${f.name} UG quota violated: ${quotaMap[f.id].ugCurrent} > ${f.ugQuotaMax}`
      );
      assert.ok(
        quotaMap[f.id].pgCurrent <= f.pgQuotaMax,
        `Faculty ${f.name} PG quota violated: ${quotaMap[f.id].pgCurrent} > ${f.pgQuotaMax}`
      );
    });
  });

  it('should allow coordinator/HOD to execute manual override with audit justification', () => {
    const targetTeamId = 'UG-TEAM-05';
    const newFacultyId = 'FAC-05'; // Dr. Arindam Bhattacharya
    const reason = 'Special embedded hardware requirement verified by coordinator.';
    const actorName = 'Dr. Ananya Roy';

    const overridden = engine.manualOverride(targetTeamId, newFacultyId, reason, actorName);

    assert.strictEqual(overridden.allocatedGuideId, newFacultyId);
    assert.strictEqual(overridden.status, 'MANUALLY_ALLOCATED');
    assert.ok(overridden.overrideAudit);
    assert.strictEqual(overridden.overrideAudit.by, actorName);
    assert.strictEqual(overridden.overrideAudit.reason, reason);
  });

  it('should revert to default allocations upon reset', () => {
    // Run matching first
    engine.runAutomatedMatching();
    // Then reset
    engine.resetAllocations();

    const teams = engine.getTeams();
    const unallocated = teams.find(t => t.teamId === 'UG-TEAM-05');
    assert.strictEqual(unallocated.allocatedGuideId, null);
    assert.strictEqual(unallocated.status, 'UNALLOCATED');
  });
});
