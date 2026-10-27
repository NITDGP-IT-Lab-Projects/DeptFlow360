/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Unit Test Suite for AllocationEngine (Zero-Sample-Data & Dynamic Onboarding)
 * Run with: node --test tests/allocationEngine.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const { DeptStore } = require('../js/data.js');
const { AllocationEngine } = require('../js/allocationEngine.js');

describe('AllocationEngine (Zero-Sample-Data & Dynamic Provisioning)', () => {
  let engine;

  beforeEach(() => {
    DeptStore.reset();
    engine = new AllocationEngine(DeptStore);
  });

  it('should initialize cleanly with zero sample data', () => {
    const faculty = engine.getFacultyList();
    const teams = engine.getTeams();

    assert.ok(Array.isArray(faculty));
    assert.strictEqual(faculty.length, 0, 'Faculty list must start empty without mock records');
    assert.ok(Array.isArray(teams));
    assert.strictEqual(teams.length, 0, 'Project teams list must start empty without mock records');
  });

  it('should dynamically add faculty members with supervisory quotas', () => {
    const f1 = engine.addFaculty({
      id: 'FAC-DYN-01',
      name: 'Dr. John Doe',
      role: 'HOD',
      designation: 'Professor & HOD',
      email: 'john.doe@university.edu',
      specializations: ['Distributed Systems', 'Cloud'],
      ugQuotaMax: 3,
      pgQuotaMax: 2
    });

    const f2 = engine.addFaculty({
      id: 'FAC-DYN-02',
      name: 'Dr. Jane Smith',
      role: 'FACULTY',
      designation: 'Associate Professor',
      email: 'jane.smith@university.edu',
      specializations: ['Artificial Intelligence', 'NLP'],
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });

    const faculty = engine.getFacultyList();
    assert.strictEqual(faculty.length, 2);
    assert.strictEqual(engine.getFacultyById('FAC-DYN-01').name, 'Dr. John Doe');
    assert.strictEqual(engine.getFacultyById('FAC-DYN-02').specializations[0], 'Artificial Intelligence');
  });

  it('should dynamically register project teams with preferences and calculate quotas', () => {
    // Add 2 mentors
    engine.addFaculty({
      id: 'FAC-01',
      name: 'Dr. Mentor One',
      role: 'FACULTY',
      email: 'm1@university.edu',
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });
    engine.addFaculty({
      id: 'FAC-02',
      name: 'Dr. Mentor Two',
      role: 'FACULTY',
      email: 'm2@university.edu',
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });

    // Add 2 teams
    engine.addTeam({
      teamId: 'UG-TEAM-DYN-01',
      type: 'UG',
      leadName: 'Alice Student',
      members: ['Alice Student', 'Bob Colleague'],
      avgCgpa: 9.2,
      domain: 'Cloud Computing',
      title: 'Serverless Edge Orchestration',
      preferences: ['FAC-01', 'FAC-02']
    });

    engine.addTeam({
      teamId: 'UG-TEAM-DYN-02',
      type: 'UG',
      leadName: 'Charlie Scholar',
      members: ['Charlie Scholar'],
      avgCgpa: 8.7,
      domain: 'AI / ML',
      title: 'Vision-Language Transformers',
      preferences: ['FAC-01', 'FAC-02']
    });

    const teams = engine.getTeams();
    assert.strictEqual(teams.length, 2);
    assert.strictEqual(teams[0].avgCgpa, 9.2);

    const quotas = engine.calculateQuotas();
    assert.strictEqual(quotas['FAC-01'].ugCurrent, 0);
    assert.strictEqual(quotas['FAC-02'].ugCurrent, 0);
  });

  it('should execute automated Gale-Shapley matching on dynamically onboarded teams', () => {
    // Mentor 1 has capacity for 1 UG team only
    engine.addFaculty({
      id: 'FAC-POPULAR',
      name: 'Dr. Popular Guide',
      role: 'FACULTY',
      email: 'pop@university.edu',
      ugQuotaMax: 1,
      pgQuotaMax: 1
    });

    // Mentor 2 has capacity for 2 UG teams
    engine.addFaculty({
      id: 'FAC-BACKUP',
      name: 'Dr. Backup Guide',
      role: 'FACULTY',
      email: 'backup@university.edu',
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });

    // Team High CGPA (9.5) picks FAC-POPULAR as 1st choice
    engine.addTeam({
      teamId: 'TEAM-HIGH-CGPA',
      type: 'UG',
      leadName: 'Merit Lead',
      members: ['Merit Lead'],
      avgCgpa: 9.5,
      domain: 'AI',
      title: 'High CGPA Proposal',
      preferences: ['FAC-POPULAR', 'FAC-BACKUP']
    });

    // Team Lower CGPA (8.0) also picks FAC-POPULAR as 1st choice
    engine.addTeam({
      teamId: 'TEAM-LOWER-CGPA',
      type: 'UG',
      leadName: 'Regular Lead',
      members: ['Regular Lead'],
      avgCgpa: 8.0,
      domain: 'AI',
      title: 'Regular CGPA Proposal',
      preferences: ['FAC-POPULAR', 'FAC-BACKUP']
    });

    const matchResult = engine.runAutomatedMatching();
    assert.strictEqual(matchResult.success, true);

    const highTeam = engine.getTeams().find(t => t.teamId === 'TEAM-HIGH-CGPA');
    const lowTeam = engine.getTeams().find(t => t.teamId === 'TEAM-LOWER-CGPA');

    // High merit gets choice 1 (FAC-POPULAR)
    assert.strictEqual(highTeam.allocatedGuideId, 'FAC-POPULAR');
    assert.strictEqual(highTeam.status, 'ALLOCATED');

    // Lower merit cascades to choice 2 (FAC-BACKUP) because quota was full
    assert.strictEqual(lowTeam.allocatedGuideId, 'FAC-BACKUP');
    assert.strictEqual(lowTeam.status, 'ALLOCATED');

    // Quotas strictly respected
    const quotaMap = engine.calculateQuotas();
    assert.strictEqual(quotaMap['FAC-POPULAR'].ugCurrent, 1);
    assert.strictEqual(quotaMap['FAC-BACKUP'].ugCurrent, 1);
  });

  it('should support manual coordinator override with complete audit logging', () => {
    engine.addFaculty({ id: 'FAC-A', name: 'Dr. A', role: 'FACULTY', email: 'a@u.edu', ugQuotaMax: 3, pgQuotaMax: 2 });
    engine.addFaculty({ id: 'FAC-B', name: 'Dr. B', role: 'FACULTY', email: 'b@u.edu', ugQuotaMax: 3, pgQuotaMax: 2 });

    engine.addTeam({
      teamId: 'TEAM-OVERRIDE',
      type: 'UG',
      leadName: 'Lead Student',
      members: ['Lead Student'],
      avgCgpa: 8.5,
      domain: 'Cybersecurity',
      title: 'Secure Enclaves',
      preferences: ['FAC-A'],
      allocatedGuideId: 'FAC-A'
    });

    const overridden = engine.manualOverride(
      'TEAM-OVERRIDE',
      'FAC-B',
      'Hardware security lab access required with Dr. B',
      'Dr. Coordinator'
    );

    assert.strictEqual(overridden.allocatedGuideId, 'FAC-B');
    assert.strictEqual(overridden.status, 'MANUALLY_ALLOCATED');
    assert.ok(overridden.overrideAudit);
    assert.strictEqual(overridden.overrideAudit.by, 'Dr. Coordinator');
    assert.strictEqual(overridden.overrideAudit.previousGuide, 'FAC-A');
  });
});
