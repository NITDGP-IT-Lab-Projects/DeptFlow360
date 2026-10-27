/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Comprehensive End-to-End Dynamic Lifecycle Test Suite
 * Validates that the system operates with zero pre-existing sample data,
 * and all users, faculty, teams, and workflows can be onboarded dynamically.
 * Run with: node --test tests/dynamicLifecycle.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const { DeptStore } = require('../js/data.js');
const { WorkflowEngine } = require('../js/workflowEngine.js');
const { AllocationEngine } = require('../js/allocationEngine.js');

describe('DeptFlow 360 - Complete Zero-Sample-Data Dynamic Lifecycle Suite', () => {
  let workflowEngine;
  let allocationEngine;

  beforeEach(() => {
    DeptStore.reset();
    workflowEngine = new WorkflowEngine(DeptStore);
    allocationEngine = new AllocationEngine(DeptStore);
  });

  it('Phase 1: Verification of Clean Slate (Zero Pre-Existing Sample Data)', () => {
    assert.strictEqual(workflowEngine.getAll().length, 0, 'No workflows must exist at startup');
    assert.strictEqual(allocationEngine.getFacultyList().length, 0, 'No faculty must exist at startup');
    assert.strictEqual(allocationEngine.getTeams().length, 0, 'No project teams must exist at startup');
    assert.strictEqual(workflowEngine.notifications.length, 0, 'No notifications must exist at startup');
  });

  it('Phase 2: Dynamic Faculty Onboarding & Supervisory Quota Provisioning', () => {
    const hod = allocationEngine.addFaculty({
      id: 'FAC-HOD-01',
      name: 'Prof. Rajesh Sen',
      role: 'HOD',
      designation: 'Professor & Head',
      email: 'hod@university.edu',
      specializations: ['Distributed Systems', 'Cloud'],
      ugQuotaMax: 3,
      pgQuotaMax: 2
    });

    const guide = allocationEngine.addFaculty({
      id: 'FAC-GUIDE-01',
      name: 'Dr. Vikramaditya Das',
      role: 'FACULTY',
      designation: 'Associate Professor',
      email: 'das@university.edu',
      specializations: ['Machine Learning', 'Edge AI'],
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });

    const coordinator = allocationEngine.addFaculty({
      id: 'FAC-COORD-01',
      name: 'Dr. Ananya Roy',
      role: 'COORDINATOR',
      designation: 'Associate Professor',
      email: 'roy@university.edu',
      specializations: ['Cybersecurity', 'Networks'],
      ugQuotaMax: 2,
      pgQuotaMax: 2
    });

    assert.strictEqual(allocationEngine.getFacultyList().length, 3);
    const quotas = allocationEngine.calculateQuotas();
    assert.strictEqual(quotas['FAC-GUIDE-01'].ugMax, 2);
    assert.strictEqual(quotas['FAC-GUIDE-01'].ugCurrent, 0);
  });

  it('Phase 3: Dynamic Student Proposal Submission & Review Queue Routing', () => {
    // 1. Add faculty
    allocationEngine.addFaculty({
      id: 'FAC-GUIDE-01',
      name: 'Dr. Vikramaditya Das',
      role: 'FACULTY',
      designation: 'Associate Professor',
      email: 'das@university.edu',
      ugQuotaMax: 2,
      pgQuotaMax: 1
    });

    const studentUser = {
      id: 'STU-2026-001',
      name: 'Sounak Bhattacharya',
      role: 'UG_STUDENT',
      title: 'B.Tech Capstone Lead'
    };

    // 2. Student submits project proposal
    const proposal = workflowEngine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Real-Time Edge Computer Vision for Micro-Aerial Swarms',
      domain: 'Autonomous Systems & Edge AI',
      proposedGuideId: 'FAC-GUIDE-01',
      guideName: 'Dr. Vikramaditya Das',
      abstract: 'Edge-based perception pipeline running on ultra-low power RISC-V neural accelerators.'
    }, 'UG_STUDENT', studentUser);

    assert.ok(proposal.id);
    assert.strictEqual(proposal.state, 'UNDER_GUIDE_REVIEW');
    assert.strictEqual(workflowEngine.getAll().length, 1);

    // 3. Verify workflow appears in guide's review queue
    const guideRoleData = { id: 'FAC-GUIDE-01', name: 'Dr. Vikramaditya Das', role: 'FACULTY' };
    const guideItems = workflowEngine.getByRole('FACULTY', guideRoleData);
    assert.strictEqual(guideItems.length, 1);
    assert.strictEqual(guideItems[0].id, proposal.id);

    // 4. Verify workflow does not leak into an unrelated student's view
    const otherStudent = { id: 'STU-OTHER', name: 'Other Student', role: 'UG_STUDENT' };
    const otherStudentItems = workflowEngine.getByRole('UG_STUDENT', otherStudent);
    assert.strictEqual(otherStudentItems.length, 0);
  });

  it('Phase 4: Multi-Stage Workflow Transitions, Revision Loop, and Sanction', () => {
    const studentUser = { id: 'STU-001', name: 'Priya Sharma', role: 'UG_STUDENT', title: 'Lead' };
    const guideUser = { id: 'FAC-01', name: 'Dr. Mentor', role: 'FACULTY', title: 'Guide' };
    const coordUser = { id: 'FAC-02', name: 'Dr. Coord', role: 'COORDINATOR', title: 'Coordinator' };
    const hodUser = { id: 'FAC-03', name: 'Prof. HOD', role: 'HOD', title: 'HOD' };

    const wf = workflowEngine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Zero-Knowledge Rollup Optimization on Ethereum Layer-2',
      domain: 'Cryptography',
      proposedGuideId: 'FAC-01',
      guideName: 'Dr. Mentor',
      abstract: 'SNARK circuit optimization.'
    }, 'UG_STUDENT', studentUser);

    // 1. Guide approves
    const gApproved = workflowEngine.transition(wf.id, 'GUIDE_APPROVE', 'Guide endorses topic.', 'FACULTY', guideUser);
    assert.strictEqual(gApproved.state, 'UNDER_COORDINATOR_REVIEW');

    // 2. Coordinator forwards
    const cForwarded = workflowEngine.transition(wf.id, 'COORDINATOR_FORWARD', 'Prerequisites checked.', 'COORDINATOR', coordUser);
    assert.strictEqual(cForwarded.state, 'UNDER_HOD_REVIEW');

    // 3. HOD requests revision
    const hRevision = workflowEngine.transition(wf.id, 'REQUEST_REVISION', 'Include comparative gas cost analysis table.', 'HOD', hodUser);
    assert.strictEqual(hRevision.state, 'REVISION_REQUESTED');

    // 4. Student resubmits
    const sResubmitted = workflowEngine.transition(wf.id, 'STUDENT_RESUBMIT', 'Updated with gas benchmark chart in Section 4.', 'UG_STUDENT', studentUser);
    assert.strictEqual(sResubmitted.state, 'UNDER_GUIDE_REVIEW');

    // 5. Fast-track re-approvals
    workflowEngine.transition(wf.id, 'GUIDE_APPROVE', 'Revisions verified.', 'FACULTY', guideUser);
    workflowEngine.transition(wf.id, 'COORDINATOR_FORWARD', 'Verified by committee.', 'COORDINATOR', coordUser);
    const finalSanction = workflowEngine.transition(wf.id, 'HOD_APPROVE', 'Formal sanction letter issued.', 'HOD', hodUser);

    assert.strictEqual(finalSanction.state, 'APPROVED');
    assert.ok(finalSanction.sanctionDate);
  });

  it('Phase 5: Continuous Assessment 3-Part Rubric Scoring & Outcome Grading', () => {
    const studentUser = { id: 'STU-001', name: 'Student Scholar', role: 'UG_STUDENT' };
    const guideUser = { id: 'FAC-01', name: 'Dr. Evaluator', role: 'FACULTY' };

    const wf = workflowEngine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Hardware-Accelerated Homomorphic Encryption',
      domain: 'VLSI & Cryptography',
      proposedGuideId: 'FAC-01',
      guideName: 'Dr. Evaluator',
      abstract: 'FPGA implementation.'
    }, 'UG_STUDENT', studentUser);

    // Rubric grading (Literature: 29/30, Rigor: 38/40, Defense: 28/30) = 95/100 -> Grade 'O'
    const graded = workflowEngine.evaluateMilestone(
      wf.id,
      'M1',
      { literatureSurvey: 29, rigorAndMath: 38, oralDefense: 28 },
      'Exceptional FPGA synthesis benchmarks and defense.',
      guideUser
    );

    assert.strictEqual(graded.status, 'EVALUATED');
    assert.strictEqual(graded.score, 95);
    assert.strictEqual(graded.grade, 'O');
    assert.strictEqual(graded.evaluator, 'Dr. Evaluator');
  });

  it('Phase 6: Dynamic Gale-Shapley Project Matching & Conflict Resolution', () => {
    // Add 2 mentors with strict capacities
    allocationEngine.addFaculty({ id: 'FAC-AI', name: 'Prof. AI', role: 'FACULTY', ugQuotaMax: 1, pgQuotaMax: 1 });
    allocationEngine.addFaculty({ id: 'FAC-SYS', name: 'Prof. Systems', role: 'FACULTY', ugQuotaMax: 2, pgQuotaMax: 1 });

    // Team 1: CGPA 9.8 - Preference 1: FAC-AI, Preference 2: FAC-SYS
    allocationEngine.addTeam({
      teamId: 'TEAM-01',
      type: 'UG',
      leadName: 'Merit First',
      avgCgpa: 9.8,
      domain: 'AI',
      title: 'Advanced LLM Compression',
      preferences: ['FAC-AI', 'FAC-SYS']
    });

    // Team 2: CGPA 8.5 - Preference 1: FAC-AI, Preference 2: FAC-SYS
    allocationEngine.addTeam({
      teamId: 'TEAM-02',
      type: 'UG',
      leadName: 'Second Merit',
      avgCgpa: 8.5,
      domain: 'AI',
      title: 'Federated Edge AI',
      preferences: ['FAC-AI', 'FAC-SYS']
    });

    const result = allocationEngine.runAutomatedMatching();
    assert.strictEqual(result.success, true);

    const t1 = allocationEngine.getTeams().find(t => t.teamId === 'TEAM-01');
    const t2 = allocationEngine.getTeams().find(t => t.teamId === 'TEAM-02');

    // T1 gets 1st choice (FAC-AI)
    assert.strictEqual(t1.allocatedGuideId, 'FAC-AI');
    // T2 gets 2nd choice (FAC-SYS) because FAC-AI quota (1) was filled by higher merit
    assert.strictEqual(t2.allocatedGuideId, 'FAC-SYS');

    // Manual override testing
    const overridden = allocationEngine.manualOverride('TEAM-02', 'FAC-AI', 'Exceptional domain alignment approved by HOD', 'Prof. HOD');
    assert.strictEqual(overridden.allocatedGuideId, 'FAC-AI');
    assert.strictEqual(overridden.status, 'MANUALLY_ALLOCATED');
  });
});
