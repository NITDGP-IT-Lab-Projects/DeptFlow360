/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Workflow State Machine, Transition Validator & Audit Trail Engine
 */

let _INITIAL_WORKFLOWS;
if (typeof require !== "undefined" && typeof module !== "undefined") {
  try {
    const data = require("./data.js");
    _INITIAL_WORKFLOWS = data.INITIAL_WORKFLOWS;
  } catch (e) {
    _INITIAL_WORKFLOWS = [];
  }
} else {
  _INITIAL_WORKFLOWS = typeof INITIAL_WORKFLOWS !== "undefined" ? INITIAL_WORKFLOWS : [];
}

class WorkflowEngine {
  constructor(store) {
    this.store = store;
    this.workflows = this.store.load("WORKFLOWS", _INITIAL_WORKFLOWS);
    this.notifications = this.store.load("NOTIFICATIONS", [
      {
        id: "NOTIF-01",
        title: "Action Required: Capstone Project Allotment",
        message: "Rahul Verma (Team 04) proposal is pending final HOD sanction.",
        timestamp: "10 mins ago",
        read: false,
        targetRole: "HOD",
        workflowId: "WF-2026-UG-04"
      },
      {
        id: "NOTIF-02",
        title: "Requisition Review Required",
        message: "NVIDIA Jetson AGX Orin requisition awaiting financial approval.",
        timestamp: "1 hour ago",
        read: false,
        targetRole: "HOD",
        workflowId: "WF-2026-REQ-08"
      },
      {
        id: "NOTIF-03",
        title: "RAC Review 2 Document Uploaded",
        message: "Sneha Mukherjee submitted RAC Review 2 draft for review.",
        timestamp: "Yesterday",
        read: true,
        targetRole: "FACULTY",
        workflowId: "WF-2026-PG-01"
      }
    ]);
  }

  // Get all active workflows
  getAll() {
    return this.workflows;
  }

  // Find by ID
  getById(id) {
    return this.workflows.find(w => w.id === id) || null;
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
        w.details.allocatedGuideId === currentRoleData.id || 
        w.details.proposedGuideId === currentRoleData.id ||
        w.submittedBy.id === currentRoleData.id ||
        w.category === "DEPARTMENTAL"
      );
    }
    if (currentRoleKey === "PG_STUDENT" || currentRoleKey === "UG_STUDENT") {
      // Students see their own submissions
      return this.workflows.filter(w => 
        w.submittedBy.id === currentRoleData.id ||
        (w.submittedBy.teamMembers && w.submittedBy.teamMembers.some(m => m.includes(currentRoleData.name)))
      );
    }
    return this.workflows;
  }

  // Determine available valid actions for a workflow based on active role & current state
  getAvailableActions(workflow, activeRoleKey, activeRoleData) {
    const actions = [];
    if (!workflow) return actions;

    const state = workflow.state;

    // Student Actions
    if ((activeRoleKey === "UG_STUDENT" || activeRoleKey === "PG_STUDENT") && 
        (workflow.submittedBy.id === activeRoleData.id)) {
      if (state === "DRAFT" || state === "REVISION_REQUESTED") {
        actions.push({ key: "RESUBMIT", label: "Resubmit with Changes", variant: "primary" });
      }
      return actions;
    }

    // Faculty Actions
    if (activeRoleKey === "FACULTY") {
      const isGuide = (workflow.details.allocatedGuideId === activeRoleData.id || 
                       workflow.details.proposedGuideId === activeRoleData.id);

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
      } else if (state === "UNDER_GUIDE_REVIEW") {
        // Coordinator can expedite or reassign guide
        actions.push({ key: "COORDINATOR_EXPEDITE", label: "Expedite Guide Review", variant: "neutral" });
      }
      return actions;
    }

    // HOD Actions
    if (activeRoleKey === "HOD") {
      if (state === "UNDER_HOD_REVIEW") {
        actions.push({ key: "HOD_APPROVE", label: "Grant Final HOD Sanction", variant: "success" });
        actions.push({ key: "REQUEST_REVISION", label: "Remand to Coordinator / Guide", variant: "warning" });
        actions.push({ key: "REJECT", label: "Reject Application", variant: "danger" });
      } else if (state === "APPROVED") {
        actions.push({ key: "GENERATE_SANCTION_LETTER", label: "Export Official Sanction Order", variant: "neutral" });
      }
      return actions;
    }

    return actions;
  }

  // Execute workflow state transition with validation
  transition(workflowId, actionKey, comment, actorRoleKey, actorRoleData) {
    const wf = this.getById(workflowId);
    if (!wf) throw new Error(`Workflow with ID ${workflowId} not found.`);

    const nowStr = new Date().toLocaleString("en-US", { 
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
    });

    const previousState = wf.state;
    let nextState = previousState;
    let actionLabel = actionKey;
    let notifMessage = "";
    let targetNotifRole = "STUDENT";

    switch (actionKey) {
      case "RESUBMIT":
        nextState = "UNDER_GUIDE_REVIEW";
        actionLabel = "STUDENT_RESUBMITTED";
        notifMessage = `${actorRoleData.name} resubmitted: ${wf.title}`;
        targetNotifRole = "FACULTY";
        break;

      case "GUIDE_ENDORSE":
        nextState = "UNDER_COORDINATOR_REVIEW";
        actionLabel = "GUIDE_ENDORSED";
        notifMessage = `${actorRoleData.name} endorsed: ${wf.title}. Awaiting coordinator verification.`;
        targetNotifRole = "COORDINATOR";
        break;

      case "COORDINATOR_VERIFY":
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
        nextState = "APPROVED";
        actionLabel = "HOD_SANCTIONED";
        notifMessage = `Official Approval granted by HOD for ${wf.title}. Project workspace activated!`;
        targetNotifRole = wf.category === "UG" ? "UG_STUDENT" : "PG_STUDENT";
        break;

      case "REQUEST_REVISION":
        nextState = "REVISION_REQUESTED";
        actionLabel = "REVISION_REQUESTED";
        notifMessage = `Revision required on ${wf.title} by ${actorRoleData.name}: "${comment}"`;
        targetNotifRole = wf.category === "UG" ? "UG_STUDENT" : "PG_STUDENT";
        break;

      case "REJECT":
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

