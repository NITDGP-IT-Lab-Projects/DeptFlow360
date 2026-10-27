/**
 * DeptFlow 360 - Workflow State Machine & Audit Engine (ES Module)
 */
import { getInitialWorkflows, getInitialNotifications } from './data.js';

export class WorkflowEngine {
  constructor(store) {
    this.store = store;
    this.workflows = this.store.load("WORKFLOWS", getInitialWorkflows());
    this.notifications = this.store.load("NOTIFICATIONS", getInitialNotifications());
  }

  resetDefaults() {
    this.workflows = getInitialWorkflows();
    this.notifications = getInitialNotifications();
    this.store.save("WORKFLOWS", this.workflows);
    this.store.save("NOTIFICATIONS", this.notifications);
    return this.workflows;
  }

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

  getById(id) {
    let wf = this.workflows.find(w => w.id === id || (w._id && (w._id === id || String(w._id) === String(id))));
    if (!wf && this.store) {
      const stored = this.store.load("WORKFLOWS", []);
      if (Array.isArray(stored) && stored.length > 0) {
        this.workflows = stored;
        wf = this.workflows.find(w => w.id === id || (w._id && (w._id === id || String(w._id) === String(id))));
      }
    }
    return wf || null;
  }

  getByRole(currentRoleKey, currentRoleData) {
    if (currentRoleKey === "HOD" || currentRoleKey === "COORDINATOR") {
      return this.workflows;
    }
    if (currentRoleKey === "FACULTY") {
      return this.workflows.filter(w => 
        w.details?.allocatedGuideId === currentRoleData.id || 
        w.details?.proposedGuideId === currentRoleData.id ||
        w.submittedBy?.id === currentRoleData.id ||
        w.category === "DEPARTMENTAL"
      );
    }
    if (currentRoleKey === "PG_STUDENT" || currentRoleKey === "UG_STUDENT") {
      return this.workflows.filter(w => 
        w.submittedBy?.id === currentRoleData.id ||
        (w.submittedBy?.teamMembers && w.submittedBy.teamMembers.some(m => typeof m === 'string' && m.includes(currentRoleData.name)))
      );
    }
    return this.workflows;
  }

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
      } else if (state === "UNDER_GUIDE_REVIEW") {
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
      case "STUDENT_RESUBMIT":
        nextState = "UNDER_GUIDE_REVIEW";
        actionLabel = "REVISION_SUBMITTED";
        notifMessage = `${actorRoleData.name} resubmitted revised proposal: ${wf.title}`;
        targetNotifRole = "FACULTY";
        break;

      case "GUIDE_APPROVE":
      case "GUIDE_ENDORSE":
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
        wf.sanctionDate = nowStr;
        wf.sanctionLetterUrl = `sanction-${wf.id.toLowerCase()}.pdf`;
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

    wf.state = nextState;

    if (!wf.history) wf.history = [];
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

    this.addNotification({
      id: "NOTIF-" + Date.now(),
      title: `Workflow Update: [${wf.id}]`,
      message: notifMessage,
      timestamp: "Just now",
      read: false,
      targetRole: targetNotifRole,
      workflowId: wf.id
    });

    this.save();
    return wf;
  }

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

    if (!wf.history) wf.history = [];
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
