/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Workflow State Machine, Transition Validator & Audit Trail Engine
 */

const _getInitialWorkflows = () => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    try {
      const data = require("./data.js");
      return JSON.parse(JSON.stringify(data.INITIAL_WORKFLOWS));
    } catch (e) {
      return [];
    }
  }
  return typeof INITIAL_WORKFLOWS !== "undefined" ? JSON.parse(JSON.stringify(INITIAL_WORKFLOWS)) : [];
};

const _getInitialNotifications = () => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    try {
      const data = require("./data.js");
      return JSON.parse(JSON.stringify(data.INITIAL_NOTIFICATIONS || []));
    } catch (e) {
      return [];
    }
  }
  return typeof INITIAL_NOTIFICATIONS !== "undefined" ? JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)) : [];
};

class WorkflowEngine {
  constructor(store) {
    this.store = store;
    this.workflows = this.store.load("WORKFLOWS", _getInitialWorkflows());
    this.notifications = this.store.load("NOTIFICATIONS", _getInitialNotifications());
  }

  resetDefaults() {
    this.workflows = _getInitialWorkflows();
    this.notifications = _getInitialNotifications();
    this.store.save("WORKFLOWS", this.workflows);
    this.store.save("NOTIFICATIONS", this.notifications);
    return this.workflows;
  }

  // Get all active workflows
  getAll() {
    return this.workflows;
  }

  setWorkflows(list) {
    if (Array.isArray(list)) {
      this.workflows = list;
      if (this.store) {
        this.store.save("WORKFLOWS", this.workflows);
      }
    }
  }

  updateWorkflow(wf) {
    if (!wf) return;
    const wfKey = wf.id || wf._id;
    const idx = this.workflows.findIndex(w => w.id === wfKey || (wf._id && (w._id === wf._id || w.id === wf._id || String(w._id) === String(wf._id))));
    if (idx >= 0) {
      this.workflows[idx] = { ...this.workflows[idx], ...wf };
    } else {
      this.workflows.unshift(wf);
    }
    if (this.store) {
      this.store.save("WORKFLOWS", this.workflows);
    }
  }

  // Find by ID
  getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const matchFn = w => 
      (w.id && String(w.id).trim().toLowerCase() === cleanId) || 
      (w._id && String(w._id).trim().toLowerCase() === cleanId);

    let wf = this.workflows.find(matchFn);
    if (!wf && this.store) {
      const stored = this.store.load("WORKFLOWS", []);
      if (Array.isArray(stored) && stored.length > 0) {
        this.workflows = stored;
        wf = this.workflows.find(matchFn);
      }
    }
    return wf || null;
  }

  // Filter workflows relevant to a role
  getByRole(currentRoleKey, currentRoleData) {
    if (currentRoleKey === "HOD") {
      // HOD sees everything, but pending HOD review is prioritized
      return this.workflows;
    }
    if (currentRoleKey === "COORDINATOR") {
      // Coordinator sees all UG/PG academic workflows
      return this.workflows;
    }
    if (currentRoleKey === "FACULTY") {
      // Faculty sees workflows where they are proposed/allocated guide or reviewer
      return this.workflows.filter(w => 
        w.details?.allocatedGuideId === currentRoleData.id || 
        w.details?.proposedGuideId === currentRoleData.id ||
        w.submittedBy?.id === currentRoleData.id ||
        w.category === "DEPARTMENTAL"
      );
    }
    if (currentRoleKey === "PG_STUDENT" || currentRoleKey === "UG_STUDENT") {
      // Students see their own submissions
      return this.workflows.filter(w => 
        w.submittedBy?.id === currentRoleData.id ||
        (w.submittedBy?.teamMembers && w.submittedBy.teamMembers.some(m => typeof m === 'string' && m.includes(currentRoleData.name)))
      );
    }
    return this.workflows;
  }

  // Determine available valid actions for a workflow based on active role & current state
  getAvailableActions(workflow, activeRoleKey, activeRoleData) {
    const actions = [];
    if (!workflow) return actions;

    const state = workflow.state;

    const isOwner = (workflow.submittedBy?.id === activeRoleData?.id) ||
                    (activeRoleData?.email && workflow.submittedBy?.email?.toLowerCase() === activeRoleData.email.toLowerCase()) ||
                    (activeRoleData?.name && workflow.submittedBy?.name?.toLowerCase().includes(activeRoleData.name.toLowerCase()));

    // Student Actions
    if ((activeRoleKey === "UG_STUDENT" || activeRoleKey === "PG_STUDENT") && isOwner) {
      if (state === "DRAFT" || state === "REVISION_REQUESTED") {
        actions.push({ key: "STUDENT_RESUBMIT", label: "Resubmit with Changes", variant: "primary" });
      }
      return actions;
    }

    // Faculty Actions
    if (activeRoleKey === "FACULTY") {
      const isGuide = (workflow.details?.allocatedGuideId === activeRoleData.id || 
                       workflow.details?.proposedGuideId === activeRoleData.id ||
                       (activeRoleData?.name && workflow.details?.guideName && workflow.details.guideName.toLowerCase().includes(activeRoleData.name.toLowerCase())));

      if (state === "UNDER_GUIDE_REVIEW" && isGuide) {
        actions.push({ key: "GUIDE_ENDORSE", label: "Endorse & Forward to Coordinator", variant: "success" });
        actions.push({ key: "REQUEST_REVISION", label: "Request Revision", variant: "warning" });
        actions.push({ key: "REJECT", label: "Reject Proposal", variant: "danger" });
      }
      return actions;
    }

    // Coordinator Actions
    if (activeRoleKey === "COORDINATOR") {
      if (state === "UNDER_COORDINATOR_REVIEW") {
        actions.push({ key: "COORDINATOR_VERIFY", label: "Verify Quotas & Forward to HOD", variant: "success" });
        actions.push({ key: "REQUEST_REVISION", label: "Send Back for Revision", variant: "warning" });
        actions.push({ key: "REJECT", label: "Reject Proposal", variant: "danger" });
      }
      return actions;
    }

    // HOD Actions
    if (activeRoleKey === "HOD") {
      if (state === "UNDER_HOD_REVIEW") {
        actions.push({ key: "HOD_APPROVE", label: "Grant Final HOD Sanction", variant: "success" });
        actions.push({ key: "REQUEST_REVISION", label: "Remand for Revision", variant: "warning" });
        actions.push({ key: "REJECT", label: "Reject Application", variant: "danger" });
      } else if (state === "APPROVED") {
        actions.push({ key: "GENERATE_SANCTION_LETTER", label: "Export Official Sanction Order", variant: "neutral" });
      }
      return actions;
    }

    return actions;
  }

  // Execute workflow state transition with validation
  transition(workflowId, actionKey, comment, actorRoleKey, actorRoleData, payload = {}) {
    const wf = this.getById(workflowId);
    if (!wf) throw new Error(`Workflow with ID ${workflowId} not found.`);

    const nowStr = new Date().toLocaleString("en-US", { 
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
    });

    const previousState = wf.state;
    const roleKey = String(actorRoleKey).toUpperCase();
    let nextState = previousState;
    let actionLabel = actionKey;
    let notifMessage = "";
    let targetNotifRole = "STUDENT";

    switch (actionKey) {
      case "RESUBMIT":
      case "STUDENT_RESUBMIT":
        if (previousState !== "REVISION_REQUESTED" && previousState !== "DRAFT") {
          throw new Error(`Resubmission is only allowed when revision has been requested (Current state: ${previousState}).`);
        }
        nextState = "UNDER_GUIDE_REVIEW";
        actionLabel = "REVISION_SUBMITTED";
        if (payload.title && payload.title.trim()) wf.title = payload.title.trim();
        if (!wf.details) wf.details = {};
        if (payload.domain && payload.domain.trim()) wf.details.domain = payload.domain.trim();
        if (payload.abstract && payload.abstract.trim()) wf.details.abstract = payload.abstract.trim();
        if (payload.proposedGuideId) wf.details.proposedGuideId = payload.proposedGuideId;
        if (payload.guideName) wf.details.guideName = payload.guideName;
        if (wf.category === 'UG') wf.details.allocatedGuideId = null;
        notifMessage = `${actorRoleData.name} resubmitted revised proposal: ${wf.title}`;
        targetNotifRole = "FACULTY";
        break;

      case "GUIDE_APPROVE":
      case "GUIDE_ENDORSE":
        if (previousState !== "UNDER_GUIDE_REVIEW") {
          throw new Error(`Guide endorsement can only be performed when the proposal is under guide review (Current state: ${previousState}).`);
        }
        nextState = "UNDER_COORDINATOR_REVIEW";
        actionLabel = "GUIDE_ENDORSED";
        if (wf.details && !wf.details.allocatedGuideId && actorRoleData.id) {
          wf.details.allocatedGuideId = actorRoleData.id;
        }
        notifMessage = `${actorRoleData.name} endorsed: ${wf.title}. Awaiting coordinator verification.`;
        targetNotifRole = "COORDINATOR";
        break;

      case "COORDINATOR_FORWARD":
      case "COORDINATOR_VERIFY":
        if (previousState === "UNDER_GUIDE_REVIEW") {
          throw new Error("The coordinator cannot review before the proposal has been reviewed and endorsed by the faculty guide.");
        }
        if (previousState !== "UNDER_COORDINATOR_REVIEW") {
          throw new Error(`Coordinator verification can only be performed when the proposal is under coordinator review (Current state: ${previousState}).`);
        }
        nextState = "UNDER_HOD_REVIEW";
        actionLabel = "COORDINATOR_VERIFIED";
        notifMessage = `Coordinator ${actorRoleData.name} verified & forwarded: ${wf.title} for HOD sanction.`;
        targetNotifRole = "HOD";
        break;

      case "COORDINATOR_EXPEDITE":
        nextState = "UNDER_COORDINATOR_REVIEW";
        actionLabel = "COORDINATOR_EXPEDITED";
        notifMessage = `Coordinator expedited workflow: ${wf.title}`;
        break;

      case "HOD_APPROVE":
      case "HOD_SANCTION":
        if (previousState === "UNDER_GUIDE_REVIEW") {
          throw new Error("The HOD cannot review or sanction before the proposal has been reviewed by the faculty guide and the coordinator.");
        }
        if (previousState === "UNDER_COORDINATOR_REVIEW") {
          throw new Error("The HOD cannot review or sanction before the proposal has been verified by the coordinator.");
        }
        if (previousState === "APPROVED") {
          throw new Error("This proposal has already received final sanction and approval.");
        }
        if (previousState !== "UNDER_HOD_REVIEW") {
          throw new Error(`HOD sanction can only be granted when the proposal is under HOD review (Current state: ${previousState}).`);
        }
        nextState = "APPROVED";
        actionLabel = "HOD_SANCTIONED";
        wf.sanctionDate = nowStr;
        wf.sanctionLetterUrl = `sanction-${wf.id.toLowerCase()}.pdf`;
        notifMessage = `Official Approval granted by HOD for ${wf.title}. Project workspace activated!`;
        targetNotifRole = wf.category === "UG" ? "UG_STUDENT" : "PG_STUDENT";
        break;

      case "REQUEST_REVISION":
        if (previousState === "UNDER_GUIDE_REVIEW" && (roleKey.includes("HOD") || roleKey.includes("HEAD"))) {
          throw new Error("The HOD cannot review before the proposal has been reviewed by the faculty guide and the coordinator.");
        }
        if (previousState === "UNDER_GUIDE_REVIEW" && roleKey.includes("COORD")) {
          throw new Error("The coordinator cannot review before the proposal has been reviewed and endorsed by the faculty guide.");
        }
        if (previousState === "UNDER_COORDINATOR_REVIEW" && (roleKey.includes("HOD") || roleKey.includes("HEAD"))) {
          throw new Error("The HOD cannot review before the proposal has been verified by the coordinator.");
        }
        if (previousState === "REVISION_REQUESTED") {
          throw new Error("Revision has already been requested for this proposal. Awaiting student resubmission.");
        }
        if (previousState === "APPROVED" || previousState === "REJECTED") {
          throw new Error(`Cannot request revision on a proposal that is already ${previousState}.`);
        }
        nextState = "REVISION_REQUESTED";
        actionLabel = "REVISION_REQUESTED";
        notifMessage = `Revision required on ${wf.title} by ${actorRoleData.name}: "${comment}"`;
        targetNotifRole = wf.category === "UG" ? "UG_STUDENT" : "PG_STUDENT";
        break;

      case "REJECT":
      case "WORKFLOW_REJECTED":
        if (previousState === "UNDER_GUIDE_REVIEW" && (roleKey.includes("HOD") || roleKey.includes("HEAD"))) {
          throw new Error("The HOD cannot review or reject before the proposal has been reviewed by the faculty guide and the coordinator.");
        }
        if (previousState === "UNDER_GUIDE_REVIEW" && roleKey.includes("COORD")) {
          throw new Error("The coordinator cannot review or reject before the proposal has been reviewed and endorsed by the faculty guide.");
        }
        if (previousState === "UNDER_COORDINATOR_REVIEW" && (roleKey.includes("HOD") || roleKey.includes("HEAD"))) {
          throw new Error("The HOD cannot review or reject before the proposal has been verified by the coordinator.");
        }
        if (previousState === "APPROVED" || previousState === "REJECTED") {
          throw new Error(`Proposal is already in terminal state: ${previousState}.`);
        }
        nextState = "REJECTED";
        actionLabel = "WORKFLOW_REJECTED";
        notifMessage = `Workflow rejected for ${wf.title}. Reason: ${comment}`;
        targetNotifRole = wf.category === "UG" ? "UG_STUDENT" : "PG_STUDENT";
        break;

      default:
        throw new Error(`Unsupported action ${actionKey}`);
    }

    // Update state
    wf.state = nextState;

    // Append to audit trail
    wf.history.push({
      timestamp: nowStr,
      actorId: actorRoleData.id || "SYS",
      actorName: actorRoleData.name,
      actorRole: actorRoleData.title || actorRoleKey,
      action: actionLabel,
      comment: comment || "Action confirmed through portal interface.",
      statusFrom: previousState,
      statusTo: nextState
    });

    // Generate in-app notification
    this.addNotification({
      id: "NOTIF-" + Date.now(),
      title: `Workflow Update: [${wf.id}]`,
      message: notifMessage,
      timestamp: "Just now",
      read: false,
      targetRole: targetNotifRole,
      workflowId: wf.id
    });

    // Persist
    this.save();
    return wf;
  }

  // Submit new workflow request (Student / Faculty)
  createWorkflow(payload, actorRoleKey, actorRoleData) {
    const count = this.workflows.length + 1;
    const prefix = payload.category === "UG" ? "WF-2026-UG-" : 
                   payload.category === "PG" ? "WF-2026-PG-" : "WF-2026-REQ-";
    const newId = prefix + (count < 10 ? "0" + count : count);

    const nowStr = new Date().toLocaleString("en-US", { 
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
    });

    const isDirectHod = (payload.category === "DEPARTMENTAL");
    const initialState = isDirectHod ? "UNDER_COORDINATOR_REVIEW" : "UNDER_GUIDE_REVIEW";

    const newWorkflow = {
      id: newId,
      type: payload.type,
      title: payload.title,
      category: payload.category,
      submittedBy: {
        id: actorRoleData.id,
        name: actorRoleData.name,
        rollNo: actorRoleData.rollNo || "N/A",
        email: `${actorRoleData.name.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
        degree: actorRoleData.title || "Student",
        teamMembers: payload.teamMembers || [actorRoleData.name]
      },
      details: {
        domain: payload.domain || "General IT",
        abstract: payload.abstract || payload.purpose || "",
        proposedGuideId: payload.proposedGuideId || null,
        allocatedGuideId: payload.allocatedGuideId || payload.proposedGuideId || null,
        budgetEstimated: payload.budgetEstimated || null,
        purpose: payload.purpose || null,
        referencesCount: payload.referencesCount || 4
      },
      state: initialState,
      slaDaysRemaining: 7,
      history: [
        {
          timestamp: nowStr,
          actorId: actorRoleData.id,
          actorName: actorRoleData.name,
          actorRole: actorRoleData.title || actorRoleKey,
          action: "SUBMITTED",
          comment: payload.initialRemarks || "Initial online proposal submitted through DAWMS portal.",
          statusFrom: "DRAFT",
          statusTo: initialState
        }
      ],
      milestones: (payload.category === "UG" || payload.category === "PG") ? [
        {
          id: "M1",
          name: payload.category === "UG" ? "Milestone 1: Literature Survey & SRS" : "RAC Review 1: Problem Formulation",
          deadline: "2026-11-20",
          weightage: 25,
          maxScore: 100,
          score: null,
          status: "PENDING",
          submissionUrl: null,
          rubricScores: {}
        },
        {
          id: "M2",
          name: payload.category === "UG" ? "Milestone 2: Design & Mathematical Model" : "RAC Review 2: Benchmarking & Proof",
          deadline: "2026-12-20",
          weightage: 35,
          maxScore: 100,
          score: null,
          status: "PENDING",
          submissionUrl: null,
          rubricScores: {}
        },
        {
          id: "M3",
          name: payload.category === "UG" ? "Milestone 3: Implementation, Code & Defense" : "Final Thesis Defense & Plagiarism Clearance",
          deadline: "2027-02-10",
          weightage: 40,
          maxScore: 100,
          score: null,
          status: "PENDING",
          submissionUrl: null,
          rubricScores: {}
        }
      ] : []
    };

    this.workflows.unshift(newWorkflow);

    // Notify coordinator or guide
    this.addNotification({
      id: "NOTIF-" + Date.now(),
      title: `New Proposal: ${newWorkflow.id}`,
      message: `${actorRoleData.name} submitted ${newWorkflow.title}.`,
      timestamp: "Just now",
      read: false,
      targetRole: initialState === "UNDER_GUIDE_REVIEW" ? "FACULTY" : "COORDINATOR",
      workflowId: newWorkflow.id
    });

    this.save();
    return newWorkflow;
  }

  // Grade milestone using rubrics
  evaluateMilestone(workflowId, milestoneId, rubricScores, feedback, evaluatorData) {
    const wf = this.getById(workflowId);
    if (!wf || !wf.milestones) throw new Error("Milestones not found for workflow");

    const milestone = wf.milestones.find(m => m.id === milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const totalScore = Object.values(rubricScores).reduce((acc, v) => acc + Number(v || 0), 0);
    milestone.score = totalScore;
    milestone.grade = totalScore >= 90 ? "O" : totalScore >= 80 ? "E" : totalScore >= 70 ? "A" : totalScore >= 60 ? "B" : totalScore >= 50 ? "C" : "F";
    milestone.rubricScores = rubricScores;
    milestone.status = "EVALUATED";
    milestone.feedback = feedback;
    milestone.evaluator = evaluatorData.name;
    milestone.evaluatedAt = new Date().toLocaleDateString();

    const nowStr = new Date().toLocaleString("en-US", { 
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
    });

    wf.history.push({
      timestamp: nowStr,
      actorId: evaluatorData.id,
      actorName: evaluatorData.name,
      actorRole: "Faculty Examiner",
      action: "RUBRIC_EVALUATION",
      comment: `Evaluated ${milestone.name}: Score ${totalScore}/${milestone.maxScore}. Feedback: "${feedback}"`,
      statusFrom: wf.state,
      statusTo: wf.state
    });

    this.addNotification({
      id: "NOTIF-" + Date.now(),
      title: `Milestone Graded: ${milestone.name}`,
      message: `${evaluatorData.name} evaluated milestone: Score ${totalScore}/100.`,
      timestamp: "Just now",
      read: false,
      targetRole: "STUDENT",
      workflowId: wf.id
    });

    this.save();
    return milestone;
  }

  // Notifications helpers
  addNotification(notif) {
    this.notifications.unshift(notif);
    if (this.notifications.length > 25) this.notifications.pop();
    this.store.save("NOTIFICATIONS", this.notifications);
  }

  getNotifications(roleKey) {
    return this.notifications.filter(n => n.targetRole === roleKey || n.targetRole === "ALL");
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.store.save("NOTIFICATIONS", this.notifications);
  }

  save() {
    this.store.save("WORKFLOWS", this.workflows);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WorkflowEngine };
}

