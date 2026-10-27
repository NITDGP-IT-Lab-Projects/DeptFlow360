const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');
const Notification = require('../models/Notification');
const ProjectTeam = require('../models/ProjectTeam');
const Faculty = require('../models/Faculty');

// Helper to query workflow by either business tracking ID or MongoDB _id
const findWorkflowById = (id) => {
  const query = [{ id: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    query.push({ _id: id });
  }
  return Workflow.findOne({ $or: query });
};

// GET /api/workflows - List workflows with role & status filters
exports.getWorkflows = async (req, res) => {
  try {
    const { role, roleId, category, status, search } = req.query;
    let query = {};

    // Category filter
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'ALL') {
      if (status === 'UNDER_REVIEW') {
        query.state = { $regex: 'UNDER_.*_REVIEW' };
      } else {
        query.state = status;
      }
    }

    // Role-based visibility
    if (role === 'FACULTY' && roleId) {
      query.$or = [
        { 'details.allocatedGuideId': roleId },
        { 'details.proposedGuideId': roleId },
        { 'submittedBy.id': roleId },
        { state: 'UNDER_GUIDE_REVIEW' },
        { category: 'DEPARTMENTAL' }
      ];
    } else if ((role === 'UG_STUDENT' || role === 'PG_STUDENT') && roleId) {
      query.$or = [
        { 'submittedBy.id': roleId },
        { 'submittedBy.teamMembers': { $regex: roleId, $options: 'i' } }
      ];
    }

    // Search query
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: regex },
          { id: regex },
          { 'submittedBy.name': regex },
          { 'details.domain': regex }
        ]
      });
    }

    const workflows = await Workflow.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, count: workflows.length, data: workflows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/workflows/:id - Single workflow details
exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await findWorkflowById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows - Create new proposal
exports.createWorkflow = async (req, res) => {
  try {
    const { title, category, type, domain, abstract, proposedGuideId, actorRole, actorData } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({ success: false, error: 'Title and Abstract are required.' });
    }

    const count = await Workflow.countDocuments();
    const prefix = category === 'UG' ? 'WF-2026-UG-' : 
                   category === 'PG' ? 'WF-2026-PG-' : 'WF-2026-REQ-';
    const newId = prefix + String(count + 1).padStart(2, '0');

    const nowStr = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const isDirectDept = (category === 'DEPARTMENTAL');
    const initialState = isDirectDept ? 'UNDER_COORDINATOR_REVIEW' : 'UNDER_GUIDE_REVIEW';

    const submitter = req.body.submittedBy || actorData || {};
    const submitterName = (submitter.name || actorData?.name || 'Student Candidate').trim();
    const submitterEmail = (submitter.email || actorData?.email || `${submitterName.toLowerCase().replace(/\s+/g, '.')}@university.edu`).trim().toLowerCase();
    const submitterId = submitter.id || actorData?.id || 'STUDENT-TEMP';
    const submitterRollNo = submitter.rollNo || actorData?.rollNo || 'N/A';
    const submitterDegree = submitter.degree || actorData?.title || 'Student';
    const submitterTeam = submitter.teamMembers || req.body.teamMembers || [submitterName];

    const newWorkflow = new Workflow({
      id: newId,
      type: type || 'UG_PROJECT',
      title,
      category: category || 'UG',
      submittedBy: {
        id: submitterId,
        name: submitterName,
        rollNo: submitterRollNo,
        email: submitterEmail,
        degree: submitterDegree,
        teamMembers: submitterTeam
      },
      details: {
        domain: domain || 'General IT',
        abstract,
        proposedGuideId: proposedGuideId || null,
        allocatedGuideId: (category === 'UG') ? null : (req.body.allocatedGuideId || proposedGuideId || null),
        guideName: req.body.guideName || null,
        purpose: isDirectDept ? abstract : null
      },
      state: initialState,
      slaDaysRemaining: 7,
      history: [
        {
          timestamp: nowStr,
          actorId: submitterId,
          actorName: submitterName,
          actorRole: actorRole || submitterDegree || 'Student',
          action: 'SUBMITTED',
          comment: req.body.initialRemarks || 'Initial online proposal submitted through DAWMS portal.',
          statusFrom: 'DRAFT',
          statusTo: initialState
        }
      ],
      milestones: (category === 'UG' || category === 'PG') ? [
        {
          id: 'M1',
          name: category === 'UG' ? 'Milestone 1: Literature Survey & SRS' : 'RAC Review 1: Problem Formulation',
          deadline: '2026-11-20',
          weightage: 25,
          maxScore: 100,
          score: null,
          status: 'PENDING',
          rubricScores: {}
        },
        {
          id: 'M2',
          name: category === 'UG' ? 'Milestone 2: Design & Mathematical Model' : 'RAC Review 2: Benchmarking & Proof',
          deadline: '2026-12-20',
          weightage: 35,
          maxScore: 100,
          score: null,
          status: 'PENDING',
          rubricScores: {}
        },
        {
          id: 'M3',
          name: category === 'UG' ? 'Milestone 3: Implementation, Code & Defense' : 'Final Thesis Defense & Clearance',
          deadline: '2027-02-10',
          weightage: 40,
          maxScore: 100,
          score: null,
          status: 'PENDING',
          rubricScores: {}
        }
      ] : []
    });

    await newWorkflow.save();

    // Create Notification
    await Notification.create({
      id: 'NOTIF-' + Date.now(),
      title: `New Proposal: ${newWorkflow.id}`,
      message: `${newWorkflow.submittedBy.name} submitted: ${newWorkflow.title}`,
      timestamp: 'Just now',
      read: false,
      targetRole: initialState === 'UNDER_GUIDE_REVIEW' ? 'FACULTY' : 'COORDINATOR',
      workflowId: newWorkflow.id
    });

    res.status(201).json({ success: true, data: newWorkflow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows/:id/transition - Execute RBAC State Transition
exports.transitionWorkflow = async (req, res) => {
  try {
    const rawAction = req.body.actionKey || req.body.action || '';
    const actionKey = String(rawAction).toUpperCase().trim();
    const comment = req.body.comment || req.body.remarks || '';
    const actorRole = req.body.actorRole || req.body.actorData?.title || req.body.actorData?.role || 'Authority';
    const actorName = req.body.actorName || req.body.actorData?.name || 'Authority';
    const actorId = req.body.actorId || req.body.actorData?.id || 'SYS';

    const wf = await findWorkflowById(req.params.id);

    if (!wf) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    const previousState = wf.state;
    let nextState = previousState;
    let actionLabel = actionKey;
    let targetNotifRole = 'STUDENT';
    let notifMessage = '';

    const nowStr = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    switch (actionKey) {
      case 'RESUBMIT':
      case 'STUDENT_RESUBMIT':
        nextState = 'UNDER_GUIDE_REVIEW';
        actionLabel = 'REVISION_SUBMITTED';
        notifMessage = `${actorName} resubmitted: ${wf.title}`;
        targetNotifRole = 'FACULTY';
        break;

      case 'GUIDE_ENDORSE':
      case 'GUIDE_APPROVE':
        nextState = 'UNDER_COORDINATOR_REVIEW';
        actionLabel = 'GUIDE_ENDORSED';
        notifMessage = `${actorName} endorsed: ${wf.title}. Awaiting coordinator review.`;
        targetNotifRole = 'COORDINATOR';
        if (!wf.details) wf.details = {};
        if (actorId && actorId !== 'SYS') {
          wf.details.allocatedGuideId = actorId;
        } else if (!wf.details.allocatedGuideId && wf.details.proposedGuideId) {
          wf.details.allocatedGuideId = wf.details.proposedGuideId;
        }
        if (actorName && actorName !== 'Authority') {
          wf.details.guideName = actorName;
        }
        break;

      case 'COORDINATOR_VERIFY':
      case 'COORDINATOR_FORWARD':
      case 'COORDINATOR_EXPEDITE':
        nextState = 'UNDER_HOD_REVIEW';
        actionLabel = 'COORDINATOR_VERIFIED';
        notifMessage = `Coordinator ${actorName} verified & forwarded: ${wf.title} for HOD sanction.`;
        targetNotifRole = 'HOD';
        break;

      case 'HOD_APPROVE':
      case 'HOD_SANCTION':
        nextState = 'APPROVED';
        actionLabel = 'HOD_SANCTIONED';
        wf.sanctionDate = nowStr;
        wf.sanctionLetterUrl = `sanction-${wf.id.toLowerCase()}.pdf`;
        notifMessage = `Official Approval granted by HOD for ${wf.title}. Project workspace active!`;
        targetNotifRole = wf.category === 'UG' ? 'UG_STUDENT' : 'PG_STUDENT';
        break;

      case 'REQUEST_REVISION':
        nextState = 'REVISION_REQUESTED';
        actionLabel = 'REVISION_REQUESTED';
        notifMessage = `Revision required on ${wf.title} by ${actorName}: "${comment}"`;
        targetNotifRole = wf.category === 'UG' ? 'UG_STUDENT' : 'PG_STUDENT';
        break;

      case 'REJECT':
      case 'WORKFLOW_REJECTED':
        nextState = 'REJECTED';
        actionLabel = 'WORKFLOW_REJECTED';
        notifMessage = `Workflow rejected for ${wf.title}. Reason: ${comment}`;
        targetNotifRole = wf.category === 'UG' ? 'UG_STUDENT' : 'PG_STUDENT';
        break;

      default:
        return res.status(400).json({ success: false, error: `Unsupported transition: ${actionKey}` });
    }

    wf.state = nextState;
    wf.history.push({
      timestamp: nowStr,
      actorId: actorId,
      actorName: actorName,
      actorRole: actorRole,
      action: actionLabel,
      comment: comment || 'Action confirmed through portal interface.',
      statusFrom: previousState,
      statusTo: nextState
    });

    await wf.save();

    // Sync ProjectTeam status and Faculty Quotas
    try {
      if (wf.category === 'UG' || wf.category === 'PG') {
        if (actionKey === 'GUIDE_ENDORSE' || actionKey === 'GUIDE_APPROVE') {
          await ProjectTeam.findOneAndUpdate(
            { workflowId: wf.id },
            { 
              allocatedGuideId: wf.details?.allocatedGuideId,
              status: 'ALLOCATED' 
            }
          );
        } else if (actionKey === 'REJECT' || actionKey === 'WORKFLOW_REJECTED') {
          await ProjectTeam.findOneAndUpdate(
            { workflowId: wf.id },
            { 
              allocatedGuideId: null,
              status: 'UNALLOCATED' 
            }
          );
        }
        
        // Recalculate faculty current quotas
        const facultyList = await Faculty.find();
        for (const f of facultyList) {
          const ugCurrent = await ProjectTeam.countDocuments({ allocatedGuideId: f.id, type: 'UG' });
          const pgCurrent = await ProjectTeam.countDocuments({ allocatedGuideId: f.id, type: 'PG' });
          await Faculty.updateOne({ id: f.id }, { ugQuotaCurrent: ugCurrent, pgQuotaCurrent: pgCurrent });
        }
      }
    } catch (teamSyncErr) {
      console.warn('ProjectTeam/Faculty quota sync notice:', teamSyncErr.message);
    }

    await Notification.create({
      id: 'NOTIF-' + Date.now(),
      title: `Workflow Update: [${wf.id}]`,
      message: notifMessage,
      timestamp: 'Just now',
      read: false,
      targetRole: targetNotifRole,
      workflowId: wf.id
    });

    res.json({ success: true, data: wf });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows/:id/milestones/:milestoneId/evaluate - Score Rubric
exports.evaluateMilestone = async (req, res) => {
  try {
    const { rubricScores, feedback, evaluatorData } = req.body;
    const wf = await findWorkflowById(req.params.id);

    if (!wf || !wf.milestones) {
      return res.status(404).json({ success: false, error: 'Workflow or milestones not found.' });
    }

    const milestone = wf.milestones.find(m => m.id === req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    const totalScore = Object.values(rubricScores || {}).reduce((acc, v) => acc + Number(v || 0), 0);
    milestone.score = totalScore;
    milestone.rubricScores = rubricScores;
    milestone.status = 'EVALUATED';
    milestone.feedback = feedback || '';
    milestone.evaluator = evaluatorData?.name || 'Faculty Examiner';
    milestone.evaluatedAt = new Date().toLocaleDateString();

    const nowStr = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    wf.history.push({
      timestamp: nowStr,
      actorId: evaluatorData?.id || 'FACULTY',
      actorName: evaluatorData?.name || 'Faculty Examiner',
      actorRole: 'Faculty Examiner',
      action: 'RUBRIC_EVALUATION',
      comment: `Evaluated ${milestone.name}: Score ${totalScore}/${milestone.maxScore}. Feedback: "${feedback}"`,
      statusFrom: wf.state,
      statusTo: wf.state
    });

    await wf.save();

    res.json({ success: true, data: milestone, workflow: wf });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflows/reset - Reset Workflows Collection to Baseline
exports.resetWorkflows = async (req, res) => {
  try {
    const { INITIAL_WORKFLOWS } = require('../seed/seedData');
    await Workflow.deleteMany({});
    await Workflow.insertMany(INITIAL_WORKFLOWS);
    res.json({ success: true, message: 'Workflows reset to clean baseline.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
