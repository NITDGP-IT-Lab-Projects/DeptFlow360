/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Unit Test Suite for WorkflowEngine (Zero-Sample-Data & Dynamic Lifecycle)
 * Run with: node --test tests/workflowEngine.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const { INITIAL_ROLES, DeptStore } = require('../js/data.js');
const { WorkflowEngine } = require('../js/workflowEngine.js');

describe('WorkflowEngine (Zero-Sample-Data & Dynamic Lifecycle)', () => {
  let engine;

  const mockSubmitter = {
    id: 'STUDENT-001',
    name: 'Aarav Patel',
    role: 'UG_STUDENT',
    title: 'B.Tech Capstone Lead'
  };

  const mockGuide = {
    id: 'FACULTY-001',
    name: 'Dr. Vikramaditya Das',
    role: 'FACULTY',
    title: 'Faculty Supervisor'
  };

  const mockCoordinator = {
    id: 'COORD-001',
    name: 'Dr. Ananya Roy',
    role: 'COORDINATOR',
    title: 'Project Coordinator'
  };

  const mockHOD = {
    id: 'HOD-001',
    name: 'Dr. Rajeshwar Sen',
    role: 'HOD',
    title: 'Head of Department'
  };

  beforeEach(() => {
    DeptStore.reset();
    engine = new WorkflowEngine(DeptStore);
  });

  it('should initialize cleanly with zero workflows', () => {
    const all = engine.getAll();
    assert.ok(Array.isArray(all));
    assert.strictEqual(all.length, 0, 'Workflow ledger must start completely empty without sample data');
  });

  it('should dynamically create a new project proposal and initialize default milestones', () => {
    const newWf = engine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Decentralized Federated Learning for Smart Cities',
      domain: 'Artificial Intelligence & Edge Compute',
      proposedGuideId: mockGuide.id,
      guideName: mockGuide.name,
      abstract: 'Investigating privacy-preserving gradient aggregation on constrained nodes.'
    }, 'UG_STUDENT', mockSubmitter);

    assert.ok(newWf.id.startsWith('WF-2026-UG-'));
    assert.strictEqual(newWf.state, 'UNDER_GUIDE_REVIEW');
    assert.strictEqual(newWf.title, 'Decentralized Federated Learning for Smart Cities');
    assert.strictEqual(newWf.submittedBy.name, 'Aarav Patel');
    assert.strictEqual(newWf.details.proposedGuideId, mockGuide.id);

    // Verify milestones initialized
    assert.ok(Array.isArray(newWf.milestones));
    assert.strictEqual(newWf.milestones.length, 3);
    assert.strictEqual(newWf.milestones[0].id, 'M1');
  });

  it('should execute full 3-tier approval transition: Guide -> Coordinator -> HOD -> Approved', () => {
    const wf = engine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Autonomous Drone Swarm Navigation',
      domain: 'Robotics',
      proposedGuideId: mockGuide.id,
      guideName: mockGuide.name,
      abstract: 'Distributed path planning using graph neural networks.'
    }, 'UG_STUDENT', mockSubmitter);

    assert.strictEqual(wf.state, 'UNDER_GUIDE_REVIEW');

    // 1. Faculty Guide Endorsement
    const step1 = engine.transition(
      wf.id,
      'GUIDE_APPROVE',
      'Topic is technically sound and within scope.',
      'FACULTY',
      mockGuide
    );
    assert.strictEqual(step1.state, 'UNDER_COORDINATOR_REVIEW');
    assert.strictEqual(step1.details.allocatedGuideId, mockGuide.id);

    // 2. Coordinator Verification
    const step2 = engine.transition(
      wf.id,
      'COORDINATOR_FORWARD',
      'All prerequisites and academic criteria verified.',
      'COORDINATOR',
      mockCoordinator
    );
    assert.strictEqual(step2.state, 'UNDER_HOD_REVIEW');

    // 3. HOD Final Sanction
    const step3 = engine.transition(
      wf.id,
      'HOD_APPROVE',
      'Sanctioned. Departmental lab resources allocated.',
      'HOD',
      mockHOD
    );
    assert.strictEqual(step3.state, 'APPROVED');
    assert.strictEqual(step3.history.length, 4); // Created + 3 approvals
  });

  it('should handle revision request and student resubmission cycle without reverting unexpectedly', () => {
    const wf = engine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Quantum Key Distribution Simulator',
      domain: 'Quantum Computing',
      proposedGuideId: mockGuide.id,
      guideName: mockGuide.name,
      abstract: 'BB84 simulation.'
    }, 'UG_STUDENT', mockSubmitter);

    // Move to HOD Review
    engine.transition(wf.id, 'GUIDE_APPROVE', 'Endorsed', 'FACULTY', mockGuide);
    engine.transition(wf.id, 'COORDINATOR_FORWARD', 'Forwarded', 'COORDINATOR', mockCoordinator);

    // HOD requests revision
    const revisedWf = engine.transition(
      wf.id,
      'REQUEST_REVISION',
      'Expand mathematical proof of Eavesdropping detection threshold.',
      'HOD',
      mockHOD
    );
    assert.strictEqual(revisedWf.state, 'REVISION_REQUESTED');

    // Submitter resubmits
    const studentActions = engine.getAvailableActions(revisedWf, 'UG_STUDENT', mockSubmitter);
    const hasResubmit = studentActions.some(a => a.key === 'STUDENT_RESUBMIT');
    assert.ok(hasResubmit, 'Submitter must have STUDENT_RESUBMIT action available');

    const resubmittedWf = engine.transition(
      wf.id,
      'STUDENT_RESUBMIT',
      'Added Appendix B with complete QKD error analysis.',
      'UG_STUDENT',
      mockSubmitter
    );

    // After resubmitting, workflow returns to guide review for verification
    assert.strictEqual(resubmittedWf.state, 'UNDER_GUIDE_REVIEW');
    assert.ok(resubmittedWf.history.some(h => h.action === 'REVISION_SUBMITTED' || h.action === 'STUDENT_RESUBMITTED'));
  });

  it('should evaluate milestone rubrics and calculate composite scores and grades', () => {
    const wf = engine.createWorkflow({
      category: 'UG',
      type: 'UG_PROJECT',
      title: 'Secure Enclaves on RISC-V',
      domain: 'Hardware Security',
      proposedGuideId: mockGuide.id,
      guideName: mockGuide.name,
      abstract: 'TEE implementation.'
    }, 'UG_STUDENT', mockSubmitter);

    const rubricScores = {
      literatureSurvey: 28,  // out of 30
      rigorAndMath: 36,      // out of 40
      oralDefense: 27        // out of 30
    };

    const gradedMilestone = engine.evaluateMilestone(
      wf.id,
      'M1',
      rubricScores,
      'Outstanding literature background and clear hardware security model.',
      mockGuide
    );

    assert.strictEqual(gradedMilestone.status, 'EVALUATED');
    assert.strictEqual(gradedMilestone.score, 91); // 28 + 36 + 27 = 91
    assert.strictEqual(gradedMilestone.grade, 'O'); // >= 90 is 'O'
    assert.strictEqual(gradedMilestone.evaluator, mockGuide.name);
  });
});
