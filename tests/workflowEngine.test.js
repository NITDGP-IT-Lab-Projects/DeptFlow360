/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Unit Test Suite for WorkflowEngine
 * Run with: node --test tests/workflowEngine.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const {
  INITIAL_FACULTY,
  INITIAL_ROLES,
  INITIAL_PROJECT_TEAMS,
  INITIAL_WORKFLOWS,
  DeptStore
} = require('../js/data.js');

const { WorkflowEngine } = require('../js/workflowEngine.js');

describe('WorkflowEngine Tests', () => {
  let engine;

  beforeEach(() => {
    DeptStore.reset();
    engine = new WorkflowEngine(DeptStore);
  });

  it('should initialize with baseline workflows', () => {
    const all = engine.getAll();
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 4);
    assert.ok(engine.getById('WF-2026-UG-04') !== null);
  });

  it('should filter workflows accurately by role', () => {
    // HOD sees all
    const hodItems = engine.getByRole('HOD', INITIAL_ROLES.HOD);
    assert.strictEqual(hodItems.length, engine.getAll().length);

    // Faculty sees relevant items
    const facItems = engine.getByRole('FACULTY', INITIAL_ROLES.FACULTY);
    assert.ok(Array.isArray(facItems));
    facItems.forEach(item => {
      const isGuide = item.details.allocatedGuideId === INITIAL_ROLES.FACULTY.id ||
                      item.details.proposedGuideId === INITIAL_ROLES.FACULTY.id ||
                      item.submittedBy.id === INITIAL_ROLES.FACULTY.id ||
                      item.category === 'DEPARTMENTAL';
      assert.ok(isGuide, `Item ${item.id} should be relevant to faculty`);
    });

    // UG Student sees only own submission
    const ugItems = engine.getByRole('UG_STUDENT', INITIAL_ROLES.UG_STUDENT);
    assert.ok(ugItems.length > 0);
    ugItems.forEach(item => {
      const isOwner = item.submittedBy.id === INITIAL_ROLES.UG_STUDENT.id ||
                      (item.submittedBy.teamMembers && item.submittedBy.teamMembers.some(m => m.includes(INITIAL_ROLES.UG_STUDENT.name)));
      assert.ok(isOwner, `Item ${item.id} should belong to UG Student`);
    });
  });

  it('should return valid available actions based on RBAC and state', () => {
    const wf = engine.getById('WF-2026-UG-04'); // State: UNDER_HOD_REVIEW
    assert.strictEqual(wf.state, 'UNDER_HOD_REVIEW');

    // HOD should have APPROVE, REQUEST_REVISION, REJECT
    const hodActions = engine.getAvailableActions(wf, 'HOD', INITIAL_ROLES.HOD);
    const hodKeys = hodActions.map(a => a.key);
    assert.ok(hodKeys.includes('HOD_APPROVE'));
    assert.ok(hodKeys.includes('REQUEST_REVISION'));
    assert.ok(hodKeys.includes('REJECT'));

    // Student should have NO actions on an item under HOD review
    const studentActions = engine.getAvailableActions(wf, 'UG_STUDENT', INITIAL_ROLES.UG_STUDENT);
    assert.strictEqual(studentActions.length, 0);
  });

  it('should transition state on HOD approval and log audit record', () => {
    const wfId = 'WF-2026-UG-04';
    const wfBefore = engine.getById(wfId);
    assert.strictEqual(wfBefore.state, 'UNDER_HOD_REVIEW');
    const initialHistoryLen = wfBefore.history.length;

    const updated = engine.transition(
      wfId,
      'HOD_APPROVE',
      'Approved project and authorized budget.',
      'HOD',
      INITIAL_ROLES.HOD
    );

    assert.strictEqual(updated.state, 'APPROVED');
    assert.strictEqual(updated.history.length, initialHistoryLen + 1);

    const latestAudit = updated.history[updated.history.length - 1];
    assert.strictEqual(latestAudit.action, 'HOD_SANCTIONED');
    assert.strictEqual(latestAudit.actorName, INITIAL_ROLES.HOD.name);
    assert.strictEqual(latestAudit.statusFrom, 'UNDER_HOD_REVIEW');
    assert.strictEqual(latestAudit.statusTo, 'APPROVED');
    assert.ok(latestAudit.comment.includes('Approved project'));
  });

  it('should handle revision request and student resubmission cycle', () => {
    const wfId = 'WF-2026-UG-04';

    // 1. HOD requests revision
    const revWf = engine.transition(
      wfId,
      'REQUEST_REVISION',
      'Refine the mathematical formulation in Section 3.',
      'HOD',
      INITIAL_ROLES.HOD
    );
    assert.strictEqual(revWf.state, 'REVISION_REQUESTED');

    // 2. In REVISION_REQUESTED, student now has RESUBMIT / STUDENT_RESUBMIT action
    const studentActions = engine.getAvailableActions(revWf, 'UG_STUDENT', INITIAL_ROLES.UG_STUDENT);
    assert.ok(studentActions.some(a => a.key === 'STUDENT_RESUBMIT' || a.key === 'RESUBMIT'));

    // 3. Student resubmits
    const resubmittedWf = engine.transition(
      wfId,
      'STUDENT_RESUBMIT',
      'Updated section 3 with lattice cryptography proof.',
      'UG_STUDENT',
      INITIAL_ROLES.UG_STUDENT
    );
    assert.strictEqual(resubmittedWf.state, 'UNDER_GUIDE_REVIEW');
  });

  it('should allow creation of new workflow items', () => {
    const initialCount = engine.getAll().length;
    const payload = {
      title: 'Quantum Key Distribution over Free-Space Optical Channels',
      category: 'UG',
      type: 'UG_PROJECT',
      domain: 'Quantum Computing & Cryptography',
      abstract: 'Investigating entanglement-based QKD protocol simulation using Qiskit.',
      proposedGuideId: 'FAC-03',
      teamMembers: ['Rahul Verma', 'Priya Sharma']
    };

    const newWf = engine.createWorkflow(payload, 'UG_STUDENT', INITIAL_ROLES.UG_STUDENT);

    assert.ok(newWf.id.startsWith('WF-2026-UG-'));
    assert.strictEqual(newWf.state, 'UNDER_GUIDE_REVIEW');
    assert.strictEqual(engine.getAll().length, initialCount + 1);
    assert.ok(newWf.milestones.length >= 3);
  });

  it('should evaluate milestone rubrics and calculate total score', () => {
    const wf = engine.getById('WF-2026-UG-04');
    const milestoneId = 'M1';

    const rubricScores = {
      literatureSurvey: 27,
      rigorAndMath: 36,
      oralDefense: 28
    };

    const evaluated = engine.evaluateMilestone(
      wf.id,
      milestoneId,
      rubricScores,
      'Solid literature coverage, prototype is clear.',
      INITIAL_ROLES.FACULTY
    );

    assert.strictEqual(evaluated.status, 'EVALUATED');
    assert.strictEqual(evaluated.score, 91);
    assert.strictEqual(evaluated.evaluator, INITIAL_ROLES.FACULTY.name);
    assert.strictEqual(evaluated.feedback, 'Solid literature coverage, prototype is clear.');
  });

  it('should generate notifications and support mark-as-read', () => {
    const notifs = engine.getNotifications('HOD');
    assert.ok(Array.isArray(notifs));
    assert.ok(notifs.length > 0);

    engine.markAllNotificationsRead();
    const updatedNotifs = engine.getNotifications('HOD');
    updatedNotifs.forEach(n => {
      assert.strictEqual(n.read, true);
    });
  });

  it('should ensure WF-2026-NOC-12 is supervised and reviewable by Guide Dr. Vikramaditya Das', () => {
    const nocWf = engine.getById('WF-2026-NOC-12');
    assert.ok(nocWf, 'NOC-12 should exist');
    assert.strictEqual(nocWf.state, 'UNDER_GUIDE_REVIEW');
    assert.strictEqual(nocWf.details.proposedGuideId, 'FAC-03');
    assert.strictEqual(nocWf.details.allocatedGuideId, 'FAC-03');

    // Guide available actions
    const guideActions = engine.getAvailableActions(nocWf, 'FACULTY', INITIAL_ROLES.FACULTY);
    const actionKeys = guideActions.map(a => a.key);
    assert.ok(actionKeys.includes('GUIDE_ENDORSE'), 'Guide should have GUIDE_ENDORSE');
    assert.ok(actionKeys.includes('REQUEST_REVISION'), 'Guide should have REQUEST_REVISION');
    assert.ok(actionKeys.includes('REJECT'), 'Guide should have REJECT');

    // Guide endorses NOC
    const endorsedWf = engine.transition('WF-2026-NOC-12', 'GUIDE_ENDORSE', 'Endorsed internship research alignment.', 'FACULTY', INITIAL_ROLES.FACULTY);
    assert.strictEqual(endorsedWf.state, 'UNDER_COORDINATOR_REVIEW');
  });
});
