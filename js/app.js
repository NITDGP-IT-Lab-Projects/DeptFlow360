/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Main Application Controller, View Renderers & Dynamic Interactions
 */

// Application State
const AppState = {
  currentRoleKey: "HOD", // HOD | COORDINATOR | FACULTY | PG_STUDENT | UG_STUDENT
  currentView: "dashboard",
  selectedWorkflowId: null,
  activeFilter: "ALL",
  activeSearchQuery: ""
};

// Global Engine References
let workflowEngine;
let allocationEngine;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Core Engines
  workflowEngine = new WorkflowEngine(DeptStore);
  allocationEngine = new AllocationEngine(DeptStore);

  // Initialize UI Bindings
  initRoleSwitcher();
  initNavigation();
  initModals();
  initActions();

  // Initial Render
  allocationEngine.calculateQuotas();
  renderApp();
});

/* ==========================================================================
   ROLE SWITCHING LOGIC
   ========================================================================== */
function initRoleSwitcher() {
  const roleSelect = document.getElementById("roleSelect");
  if (!roleSelect) return;

  roleSelect.value = AppState.currentRoleKey;

  roleSelect.addEventListener("change", (e) => {
    AppState.currentRoleKey = e.target.value;
    const roleData = INITIAL_ROLES[AppState.currentRoleKey];

    showToast(
      "Role Switched", 
      `Operating context switched to ${roleData.title} (${roleData.name})`, 
      "info"
    );

    renderApp();
  });
}

function getCurrentRoleData() {
  return INITIAL_ROLES[AppState.currentRoleKey];
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link[data-view]");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-view");
      navigateToView(targetView);
    });
  });
}

function navigateToView(viewName) {
  AppState.currentView = viewName;
  
  // Update nav link active state
  document.querySelectorAll(".nav-link[data-view]").forEach(l => {
    l.classList.toggle("active", l.getAttribute("data-view") === viewName);
  });

  // Switch view sections
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
  });

  const activeSection = document.getElementById(`view-${viewName}`);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  // Update Page Title
  const titles = {
    dashboard: { title: "Departmental Operations & Workflow Overview", sub: "Information Technology Department • Academic Year 2026-27" },
    approvals: { title: "Workflow & Multi-Tier Approvals Inbox", sub: "Action proposals, PG dissertations, endorsements and requisitions" },
    allocation: { title: "Project Allocation & Quota Management", sub: "Preference-based algorithm, capacity balancing & manual override" },
    ugpg_desk: { title: "UG & PG Academic Activity Desk", sub: "Project registration, milestone uploads, clearance requests" },
    rubric_eval: { title: "Defense & Milestone Rubric Evaluation Station", sub: "Continuous assessment rubrics, viva scoring & feedback" },
    faculty_dir: { title: "Faculty Directory & Supervision Quotas", sub: "Specializations, current project loads & research domains" },
    architecture: { title: "System Architecture & Software Interface Design", sub: "Workflow state machine, BPMN pipeline & RBAC matrix specification" }
  };

  const meta = titles[viewName] || titles.dashboard;
  const pageTitleEl = document.getElementById("pageTitle");
  const pageSubEl = document.getElementById("pageSubtitle");
  if (pageTitleEl) pageTitleEl.textContent = meta.title;
  if (pageSubEl) pageSubEl.textContent = meta.sub;

  renderCurrentView();
}

/* ==========================================================================
   CORE RENDER PIPELINE
   ========================================================================== */
function renderApp() {
  updateUserHeaderBadge();
  updateNotificationCount();
  renderCurrentView();
}

function updateUserHeaderBadge() {
  const roleData = getCurrentRoleData();
  const userNameEl = document.getElementById("headerUserName");
  const userRoleEl = document.getElementById("headerUserRole");
  const userAvatarEl = document.getElementById("headerUserAvatar");

  if (userNameEl) userNameEl.textContent = roleData.name;
  if (userRoleEl) userRoleEl.textContent = roleData.title;
  if (userAvatarEl) {
    const avatar = roleData.avatar || (AppState.currentRoleKey.includes("STUDENT") ? "🎓" : "👨‍🏫");
    userAvatarEl.textContent = avatar;
  }

  // Update badge on sidebar inbox
  const myWorkflows = workflowEngine.getByRole(AppState.currentRoleKey, roleData);
  const pendingCount = myWorkflows.filter(w => isPendingMyAction(w)).length;
  const inboxBadge = document.getElementById("inboxNavBadge");
  if (inboxBadge) {
    inboxBadge.textContent = pendingCount;
    inboxBadge.style.display = pendingCount > 0 ? "inline-block" : "none";
  }
}

function isPendingMyAction(workflow) {
  const roleKey = AppState.currentRoleKey;
  const roleData = getCurrentRoleData();

  if (roleKey === "HOD" && workflow.state === "UNDER_HOD_REVIEW") return true;
  if (roleKey === "COORDINATOR" && workflow.state === "UNDER_COORDINATOR_REVIEW") return true;
  if (roleKey === "FACULTY" && workflow.state === "UNDER_GUIDE_REVIEW" && 
      (workflow.details.allocatedGuideId === roleData.id || workflow.details.proposedGuideId === roleData.id)) {
    return true;
  }
  if ((roleKey === "UG_STUDENT" || roleKey === "PG_STUDENT") && 
      workflow.state === "REVISION_REQUESTED" && workflow.submittedBy.id === roleData.id) {
    return true;
  }
  return false;
}

function updateNotificationCount() {
  const notifs = workflowEngine.getNotifications(AppState.currentRoleKey);
  const unreadCount = notifs.filter(n => !n.read).length;
  const notifBadge = document.getElementById("notifCountBadge");
  if (notifBadge) {
    notifBadge.textContent = unreadCount;
    notifBadge.style.display = unreadCount > 0 ? "flex" : "none";
  }
}

function renderCurrentView() {
  switch (AppState.currentView) {
    case "dashboard":
      renderDashboard();
      break;
    case "approvals":
      renderApprovals();
      break;
    case "allocation":
      renderAllocation();
      break;
    case "ugpg_desk":
      renderUgPgDesk();
      break;
    case "rubric_eval":
      renderRubricEval();
      break;
    case "faculty_dir":
      renderFacultyDir();
      break;
    case "architecture":
      // Static architecture content
      break;
  }
}

/* ==========================================================================
   VIEW 1: DASHBOARD
   ========================================================================== */
function renderDashboard() {
  const allWorkflows = workflowEngine.getAll();
  const roleData = getCurrentRoleData();
  const myWorkflows = workflowEngine.getByRole(AppState.currentRoleKey, roleData);
  const pendingActions = myWorkflows.filter(w => isPendingMyAction(w));
  const approvedCount = allWorkflows.filter(w => w.state === "APPROVED").length;

  // Update KPIs
  const kpiTotal = document.getElementById("kpiTotalWorkflows");
  const kpiPending = document.getElementById("kpiPendingAction");
  const kpiApproved = document.getElementById("kpiApproved");
  const kpiQuota = document.getElementById("kpiQuotaLoad");

  if (kpiTotal) kpiTotal.textContent = allWorkflows.length;
  if (kpiPending) kpiPending.textContent = pendingActions.length;
  if (kpiApproved) kpiApproved.textContent = approvedCount;

  // Calculate departmental capacity
  const facultyList = allocationEngine.getFacultyList();
  const totalUgCap = facultyList.reduce((acc, f) => acc + f.ugQuotaMax, 0);
  const totalUgUsed = facultyList.reduce((acc, f) => acc + f.ugQuotaCurrent, 0);
  const pct = Math.round((totalUgUsed / totalUgCap) * 100);
  if (kpiQuota) kpiQuota.textContent = `${pct}%`;

  // Role Directive Banner
  const bannerTitle = document.getElementById("directiveTitle");
  const bannerDesc = document.getElementById("directiveDesc");
  const bannerActionBtn = document.getElementById("directiveActionBtn");

  if (bannerTitle && bannerDesc) {
    if (AppState.currentRoleKey === "HOD") {
      bannerTitle.textContent = `Head of Department Authority • ${pendingActions.length} Pending Clearances`;
      bannerDesc.textContent = `You have final executive sanctioning powers. ${pendingActions.length} item(s) are awaiting your formal sign-off.`;
      bannerActionBtn.textContent = "Review Pending Clearances";
      bannerActionBtn.onclick = () => { AppState.activeFilter = "PENDING_ME"; navigateToView("approvals"); };
    } else if (AppState.currentRoleKey === "COORDINATOR") {
      bannerTitle.textContent = `Project Convener Desk • Quota Balancing & Allocation`;
      bannerDesc.textContent = `Review guide allotments, run the preference-matching algorithm, and verify proposals for HOD sanction.`;
      bannerActionBtn.textContent = "Open Allocation Engine";
      bannerActionBtn.onclick = () => navigateToView("allocation");
    } else if (AppState.currentRoleKey === "FACULTY") {
      bannerTitle.textContent = `Faculty Supervision Station • ${roleData.name}`;
      bannerDesc.textContent = `Review student proposals, evaluate continuous milestone submissions via rubrics, and track advisees.`;
      bannerActionBtn.textContent = "Grade Milestone Defense";
      bannerActionBtn.onclick = () => navigateToView("rubric_eval");
    } else {
      bannerTitle.textContent = `Student Academic Portal • ${roleData.title}`;
      bannerDesc.textContent = `Monitor proposal approval status in real-time, submit progress milestone reports, and request clearance.`;
      bannerActionBtn.textContent = "Submit New Request";
      bannerActionBtn.onclick = () => openNewSubmissionModal();
    }
  }

  // Render Recent Activity Stream
  const activityContainer = document.getElementById("recentActivityList");
  if (activityContainer) {
    // Gather all historical entries across workflows
    const allHistory = [];
    allWorkflows.forEach(w => {
      w.history.forEach(h => {
        allHistory.push({ ...h, workflowTitle: w.title, workflowId: w.id });
      });
    });

    // Sort recent first
    allHistory.reverse();
    const recent = allHistory.slice(0, 6);

    activityContainer.innerHTML = recent.map(h => `
      <div class="timeline-item">
        <div class="timeline-bullet">${getActionIcon(h.action)}</div>
        <div class="timeline-content">
          <div class="timeline-meta">
            <span class="timeline-actor">${h.actorName} <small style="color:var(--text-muted)">(${h.actorRole})</small></span>
            <span class="timeline-time">${h.timestamp}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600; margin-bottom:3px;">
            [${h.workflowId}] ${h.workflowTitle}
          </div>
          <p class="timeline-comment">${h.comment}</p>
        </div>
      </div>
    `).join("");
  }

  // Quick Action Pending Table on Dashboard
  const quickTableBody = document.getElementById("dashboardQuickTableBody");
  if (quickTableBody) {
    const displayList = pendingActions.length > 0 ? pendingActions : myWorkflows.slice(0, 5);
    if (displayList.length === 0) {
      quickTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No pending actions requiring your attention right now. All caught up!</td></tr>`;
    } else {
      quickTableBody.innerHTML = displayList.map(w => renderWorkflowTableRow(w)).join("");
    }
  }
}

function getActionIcon(action) {
  if (action.includes("APPROVED") || action.includes("SANCTIONED")) return "✅";
  if (action.includes("ENDORSED")) return "👍";
  if (action.includes("VERIFIED")) return "🔍";
  if (action.includes("REVISION")) return "⚠️";
  if (action.includes("REJECTED")) return "❌";
  if (action.includes("RUBRIC")) return "📝";
  return "📄";
}

/* ==========================================================================
   VIEW 2: APPROVALS & WORKFLOW INBOX
   ========================================================================== */
function renderApprovals() {
  const roleData = getCurrentRoleData();
  let workflows = workflowEngine.getByRole(AppState.currentRoleKey, roleData);

  // Apply Filter Pills
  const filter = AppState.activeFilter;
  if (filter === "PENDING_ME") {
    workflows = workflows.filter(w => isPendingMyAction(w));
  } else if (filter === "UG") {
    workflows = workflows.filter(w => w.category === "UG");
  } else if (filter === "PG") {
    workflows = workflows.filter(w => w.category === "PG");
  } else if (filter === "APPROVED") {
    workflows = workflows.filter(w => w.state === "APPROVED");
  } else if (filter === "UNDER_REVIEW") {
    workflows = workflows.filter(w => w.state.includes("REVIEW"));
  }

  // Apply Search
  if (AppState.activeSearchQuery.trim() !== "") {
    const q = AppState.activeSearchQuery.toLowerCase();
    workflows = workflows.filter(w => 
      w.title.toLowerCase().includes(q) || 
      w.id.toLowerCase().includes(q) || 
      w.submittedBy.name.toLowerCase().includes(q) ||
      (w.details.domain && w.details.domain.toLowerCase().includes(q))
    );
  }

  const tableBody = document.getElementById("approvalsTableBody");
  const countBadge = document.getElementById("approvalsCountBadge");
  if (countBadge) countBadge.textContent = `${workflows.length} records`;

  if (tableBody) {
    if (workflows.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No workflow items match the selected filter criteria.</td></tr>`;
    } else {
      tableBody.innerHTML = workflows.map(w => renderWorkflowTableRow(w, true)).join("");
    }
  }

  // Set active filter button
  document.querySelectorAll(".filter-pill[data-filter]").forEach(pill => {
    pill.classList.toggle("active", pill.getAttribute("data-filter") === AppState.activeFilter);
  });
}

function renderWorkflowTableRow(w, showActions = true) {
  const isUrgent = isPendingMyAction(w);
  const rowHighlight = isUrgent ? `style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--accent-primary); cursor: pointer;"` : `style="cursor: pointer;"`;
  const catClass = w.category === "UG" ? "ug" : w.category === "PG" ? "pg" : "dept";

  return `
    <tr ${rowHighlight} onclick="openWorkflowDetailModal('${w.id}')">
      <td>
        <span class="wf-id">${w.id}</span>
      </td>
      <td class="wf-title-cell">
        <div class="wf-title-text" title="${escapeHtml(w.title)}">${escapeHtml(w.title)}</div>
        <div class="wf-submitter">By: <strong>${w.submittedBy.name}</strong> • ${w.submittedBy.degree || ""}</div>
      </td>
      <td>
        <span class="type-tag ${catClass}">${w.category}</span>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${formatTypeName(w.type)}</div>
      </td>
      <td>
        <span class="status-badge ${w.state}">${formatStateName(w.state)}</span>
      </td>
      <td>
        <span style="font-size:0.8rem; font-weight:600; color: ${w.slaDaysRemaining <= 2 ? 'var(--status-pending)' : 'var(--text-secondary)'};">
          ⏳ ${w.slaDaysRemaining}d left
        </span>
      </td>
      ${showActions ? `
      <td>
        <div style="display:flex; gap:0.4rem;" onclick="event.stopPropagation()">
          <button class="btn btn-secondary btn-sm" onclick="openWorkflowDetailModal('${w.id}')" style="padding:0.4rem 0.75rem; font-size:0.75rem;">
            ${isUrgent ? '⚡ Action' : '👁️ View'}
          </button>
        </div>
      </td>
      ` : ''}
    </tr>
  `;
}

function formatStateName(state) {
  return state.replace(/_/g, " ");
}

function formatTypeName(type) {
  const map = {
    UG_PROJECT: "B.Tech Capstone",
    PG_DISSERTATION: "M.Tech Dissertation",
    LEAVE_NOC: "Internship / NOC",
    LAB_EQUIPMENT: "Lab Requisition"
  };
  return map[type] || type;
}

/* ==========================================================================
   VIEW 3: PROJECT ALLOCATION & QUOTA ENGINE
   ========================================================================== */
function renderAllocation() {
  const facultyList = allocationEngine.getFacultyList();
  const teams = allocationEngine.getTeams();

  // Faculty Quotas Column
  const quotaContainer = document.getElementById("facultyQuotaList");
  if (quotaContainer) {
    quotaContainer.innerHTML = facultyList.map(f => {
      const ugPct = Math.round((f.ugQuotaCurrent / f.ugQuotaMax) * 100);
      const pgPct = Math.round((f.pgQuotaCurrent / f.pgQuotaMax) * 100);

      const ugColor = ugPct >= 100 ? "red" : ugPct >= 66 ? "amber" : "green";
      const pgColor = pgPct >= 100 ? "red" : pgPct >= 66 ? "amber" : "green";

      return `
        <div class="faculty-quota-card">
          <div class="quota-header">
            <div class="faculty-name-role">
              <span style="font-size:1.4rem;">${f.avatar}</span>
              <div>
                <strong>${f.name}</strong>
                <div><span>${f.designation} • ${f.room}</span></div>
              </div>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
            Expertise: ${f.specializations.join(", ")}
          </div>
          <div class="quota-bars-container">
            <div class="quota-bar-wrapper">
              <span class="quota-bar-label">UG Teams:</span>
              <div class="progress-track">
                <div class="progress-fill ${ugColor}" style="width: ${Math.min(ugPct, 100)}%;"></div>
              </div>
              <span style="font-family:var(--font-mono); font-weight:700; width:45px; text-align:right;">
                ${f.ugQuotaCurrent}/${f.ugQuotaMax}
              </span>
            </div>
            <div class="quota-bar-wrapper">
              <span class="quota-bar-label">PG Scholars:</span>
              <div class="progress-track">
                <div class="progress-fill ${pgColor}" style="width: ${Math.min(pgPct, 100)}%;"></div>
              </div>
              <span style="font-family:var(--font-mono); font-weight:700; width:45px; text-align:right;">
                ${f.pgQuotaCurrent}/${f.pgQuotaMax}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Student Teams Allocation Grid
  const teamGridBody = document.getElementById("allocationTeamsTableBody");
  if (teamGridBody) {
    teamGridBody.innerHTML = teams.map(t => {
      const allocatedGuide = t.allocatedGuideId ? allocationEngine.getFacultyById(t.allocatedGuideId) : null;
      const choicesText = t.preferences.map((pId, idx) => {
        const fac = allocationEngine.getFacultyById(pId);
        return `#${idx+1}: ${fac ? fac.name.split(" ")[1] : pId}`;
      }).join(" | ");

      const canOverride = (AppState.currentRoleKey === "COORDINATOR" || AppState.currentRoleKey === "HOD");

      return `
        <tr>
          <td>
            <strong style="color:var(--text-primary);">${t.teamId}</strong>
            <span class="type-tag ${t.type.toLowerCase()}" style="margin-left:4px;">${t.type}</span>
            <div style="font-size:0.72rem; color:var(--text-muted);">${t.members.join(", ")}</div>
          </td>
          <td>
            <div style="max-width:240px; font-weight:500; font-size:0.82rem; color:var(--text-primary);">${t.title}</div>
            <span style="font-size:0.72rem; color:var(--accent-cyan);">${t.domain}</span>
          </td>
          <td>
            <span style="font-family:var(--font-mono); font-weight:700; color:var(--status-approved);">
              ${t.avgCgpa.toFixed(2)}
            </span>
          </td>
          <td style="font-size:0.75rem; color:var(--text-secondary);">
            ${choicesText}
          </td>
          <td>
            ${allocatedGuide ? `
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <span>${allocatedGuide.avatar}</span>
                <strong style="color:#fff; font-size:0.84rem;">${allocatedGuide.name}</strong>
              </div>
            ` : `<span style="color:var(--status-pending); font-weight:600;">⚠️ Unallocated</span>`}
          </td>
          ${canOverride ? `
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openManualOverrideModal('${t.teamId}')" style="padding:0.35rem 0.65rem; font-size:0.74rem;">
              ✏️ Override
            </button>
          </td>
          ` : '<td><span style="color:var(--text-muted); font-size:0.75rem;">Locked</span></td>'}
        </tr>
      `;
    }).join("");
  }
}

/* ==========================================================================
   VIEW 4: UG & PG ACADEMIC DESK
   ========================================================================== */
function renderUgPgDesk() {
  const roleData = getCurrentRoleData();
  const mySubmissions = workflowEngine.getByRole(AppState.currentRoleKey, roleData);
  const container = document.getElementById("studentSubmissionsList");

  if (!container) return;

  if (mySubmissions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:var(--radius-lg); border:1px dashed var(--border-medium);">
        <span style="font-size:2.5rem; display:block; margin-bottom:1rem;">📂</span>
        <h3 style="font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">No Academic Submissions Found</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); max-width:450px; margin:0 auto 1.5rem auto;">
          You haven't submitted any Capstone proposals, PG dissertation topics, or departmental requisitions under this profile.
        </p>
        <button class="btn btn-primary" onclick="openNewSubmissionModal()">
          ➕ Submit New Proposal
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = mySubmissions.map(w => {
    return `
      <div class="card-panel" style="margin-bottom:1.5rem;">
        <div class="card-panel-header">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="wf-id">${w.id}</span>
              <span class="status-badge ${w.state}">${formatStateName(w.state)}</span>
              <span class="type-tag ${w.category.toLowerCase()}">${formatTypeName(w.type)}</span>
            </div>
            <h2 style="font-size:1.15rem; color:#fff;">${escapeHtml(w.title)}</h2>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="openWorkflowDetailModal('${w.id}')">
            View Lifecycle Stepper
          </button>
        </div>

        <!-- Visual Stepper Progress Bar -->
        ${renderWorkflowStepperHtml(w.state)}

        <div style="display:grid; grid-template-columns:2fr 1fr; gap:1.5rem; margin-top:1rem;">
          <div>
            <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem;">Abstract / Purpose</h4>
            <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">${w.details.abstract || w.details.purpose || "N/A"}</p>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Assigned / Proposed Guide</div>
            <div style="font-weight:600; color:#fff; font-size:0.9rem; margin-top:2px;">
              ${w.details.guideName || (w.details.allocatedGuideId ? allocationEngine.getFacultyById(w.details.allocatedGuideId)?.name : "Under Allocation")}
            </div>
            <div style="margin-top:0.75rem; font-size:0.75rem; color:var(--text-muted);">Domain Track</div>
            <div style="font-weight:600; color:var(--accent-cyan); font-size:0.84rem;">${w.details.domain || "General IT"}</div>
          </div>
        </div>

        ${w.milestones && w.milestones.length > 0 ? `
        <div style="margin-top:1.5rem; border-top:1px solid var(--border-subtle); padding-top:1rem;">
          <h4 style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:0.75rem;">Continuous Milestone Defense Progress</h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
            ${w.milestones.map(m => `
              <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem;">
                <div style="font-size:0.75rem; color:var(--text-muted);">${m.name}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                  <span style="font-size:0.75rem; color:var(--text-secondary);">Deadline: ${m.deadline}</span>
                  ${m.status === 'EVALUATED' ? `
                    <span style="font-family:var(--font-mono); font-weight:800; color:var(--status-approved);">
                      ${m.score}/100
                    </span>
                  ` : `
                    <span style="font-size:0.72rem; padding:0.15rem 0.45rem; border-radius:var(--radius-full); background:rgba(255,255,255,0.06); color:var(--text-muted);">
                      ${m.status}
                    </span>
                  `}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function renderWorkflowStepperHtml(state) {
  const steps = [
    { key: "SUBMITTED", label: "Proposal Submitted" },
    { key: "UNDER_GUIDE_REVIEW", label: "Guide Endorsement" },
    { key: "UNDER_COORDINATOR_REVIEW", label: "Coordinator Check" },
    { key: "UNDER_HOD_REVIEW", label: "HOD Approval" },
    { key: "APPROVED", label: "Sanctioned & Active" }
  ];

  const stateOrder = {
    "DRAFT": 0,
    "SUBMITTED": 1,
    "UNDER_GUIDE_REVIEW": 2,
    "UNDER_COORDINATOR_REVIEW": 3,
    "UNDER_HOD_REVIEW": 4,
    "APPROVED": 5,
    "REVISION_REQUESTED": 2,
    "REJECTED": -1
  };

  const currentIndex = stateOrder[state] !== undefined ? stateOrder[state] : 1;
  const pctWidth = currentIndex <= 1 ? 0 : Math.min(100, (currentIndex - 1) / (steps.length - 1) * 100);

  return `
    <div class="workflow-stepper">
      <div class="step-connector">
        <div class="step-connector-fill" style="width: ${pctWidth}%;"></div>
      </div>
      ${steps.map((st, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentIndex || state === "APPROVED";
        const isActive = (stepNum === currentIndex && state !== "APPROVED");
        const nodeClass = isCompleted ? "completed" : isActive ? "active" : "";

        return `
          <div class="step-node ${nodeClass}">
            <div class="step-circle">${isCompleted ? '✓' : stepNum}</div>
            <div class="step-label">${st.label}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ==========================================================================
   VIEW 5: RUBRIC EVALUATION & DEFENSE
   ========================================================================== */
function renderRubricEval() {
  const allWorkflows = workflowEngine.getAll().filter(w => w.milestones && w.milestones.length > 0);
  const container = document.getElementById("rubricEvaluationList");
  if (!container) return;

  container.innerHTML = allWorkflows.map(wf => {
    return `
      <div class="card-panel" style="margin-bottom:1.5rem;">
        <div class="card-panel-header">
          <div>
            <span class="wf-id">${wf.id}</span>
            <span class="type-tag ${wf.category.toLowerCase()}" style="margin-left:4px;">${wf.category}</span>
            <h3 style="color:#fff; font-size:1.05rem; margin-top:2px;">${escapeHtml(wf.title)}</h3>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Lead: ${wf.submittedBy.name} • Guide: ${wf.details.guideName || "Allocated Guide"}
            </div>
          </div>
          <span class="status-badge ${wf.state}">${formatStateName(wf.state)}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.85rem;">
          ${wf.milestones.map(m => `
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
              <div>
                <strong style="color:#fff; font-size:0.9rem;">${m.name}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                  Weightage: ${m.weightage}% • Max Score: ${m.maxScore} • Deadline: ${m.deadline}
                </div>
                ${m.feedback ? `
                  <div style="font-size:0.78rem; color:var(--accent-cyan); margin-top:4px;">
                    💬 Examiner Remark: "${m.feedback}"
                  </div>
                ` : ''}
              </div>

              <div style="display:flex; align-items:center; gap:1rem;">
                ${m.status === 'EVALUATED' ? `
                  <div style="text-align:right;">
                    <span style="font-family:var(--font-mono); font-size:1.25rem; font-weight:800; color:var(--status-approved);">
                      ${m.score}/100
                    </span>
                    <div style="font-size:0.68rem; color:var(--text-muted);">Graded by ${m.evaluator || 'Examiner'}</div>
                  </div>
                ` : `
                  <span style="font-size:0.75rem; color:var(--status-pending); font-weight:600;">Pending Assessment</span>
                `}

                <button class="btn btn-primary btn-sm" onclick="openRubricScoringModal('${wf.id}', '${m.id}')" style="padding:0.4rem 0.85rem; font-size:0.78rem;">
                  ⚖️ ${m.status === 'EVALUATED' ? 'Re-Grade' : 'Score Rubric'}
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   VIEW 6: FACULTY DIRECTORY & QUOTAS
   ========================================================================== */
function renderFacultyDir() {
  const container = document.getElementById("facultyDirectoryGrid");
  if (!container) return;

  const facultyList = allocationEngine.getFacultyList();
  container.innerHTML = facultyList.map(f => {
    return `
      <div class="card-panel">
        <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1rem;">
          <div style="font-size:2.5rem; width:54px; height:54px; border-radius:var(--radius-md); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-subtle);">
            ${f.avatar}
          </div>
          <div>
            <h3 style="color:#fff; font-size:1.05rem;">${f.name}</h3>
            <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600;">${f.designation}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${f.email} • ${f.room}</div>
          </div>
        </div>

        <div style="margin-bottom:1rem;">
          <span style="font-size:0.72rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Research Domains:</span>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.35rem;">
            ${f.specializations.map(s => `
              <span style="font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:var(--radius-sm); background:rgba(99,102,241,0.12); color:#a5b4fc; border:1px solid rgba(99,102,241,0.25);">
                ${s}
              </span>
            `).join("")}
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.25); border-radius:var(--radius-md); padding:0.85rem; border:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.4rem;">
            <span style="color:var(--text-secondary);">UG Supervision Load:</span>
            <strong style="color:#fff; font-family:var(--font-mono);">${f.ugQuotaCurrent} / ${f.ugQuotaMax} Teams</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
            <span style="color:var(--text-secondary);">PG Thesis Load:</span>
            <strong style="color:#fff; font-family:var(--font-mono);">${f.pgQuotaCurrent} / ${f.pgQuotaMax} Scholars</strong>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   WORKFLOW DETAIL & ACTION MODAL
   ========================================================================== */
function openWorkflowDetailModal(workflowId) {
  const wf = workflowEngine.getById(workflowId);
  if (!wf) return;

  AppState.selectedWorkflowId = workflowId;
  const roleData = getCurrentRoleData();

  // Populate Modal Header & Basic Fields
  document.getElementById("modalWfId").textContent = wf.id;
  document.getElementById("modalWfTitle").textContent = wf.title;
  document.getElementById("modalWfStatusBadge").innerHTML = `
    <span class="status-badge ${wf.state}">${formatStateName(wf.state)}</span>
    <span class="type-tag ${wf.category.toLowerCase()}" style="margin-left:6px;">${wf.category}</span>
  `;

  // Render Visual Stepper in Modal
  document.getElementById("modalWfStepperContainer").innerHTML = renderWorkflowStepperHtml(wf.state);

  // Proposal Meta
  document.getElementById("modalWfSubmitter").textContent = `${wf.submittedBy.name} (${wf.submittedBy.degree || wf.submittedBy.rollNo})`;
  document.getElementById("modalWfDomain").textContent = wf.details.domain || "Departmental Activity";
  document.getElementById("modalWfAbstract").textContent = wf.details.abstract || wf.details.purpose || "No abstract provided.";
  
  const guideName = wf.details.guideName || (wf.details.allocatedGuideId ? allocationEngine.getFacultyById(wf.details.allocatedGuideId)?.name : "Not Allocated");
  document.getElementById("modalWfGuide").textContent = guideName;

  // Render Full Audit History Timeline
  const timelineContainer = document.getElementById("modalWfHistoryTimeline");
  if (timelineContainer) {
    timelineContainer.innerHTML = wf.history.map(h => `
      <div class="timeline-item">
        <div class="timeline-bullet">${getActionIcon(h.action)}</div>
        <div class="timeline-content">
          <div class="timeline-meta">
            <span class="timeline-actor">${h.actorName} <small style="color:var(--text-muted);">(${h.actorRole})</small></span>
            <span class="timeline-time">${h.timestamp}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600; margin-bottom:2px;">
            Action: ${h.action} (${h.statusFrom} → ${h.statusTo})
          </div>
          <p class="timeline-comment">${h.comment}</p>
        </div>
      </div>
    `).join("");
  }

  // Render Contextual Action Buttons based on RBAC & State
  const actionsContainer = document.getElementById("modalWfActionsContainer");
  const availableActions = workflowEngine.getAvailableActions(wf, AppState.currentRoleKey, roleData);

  if (availableActions.length === 0) {
    actionsContainer.innerHTML = `
      <div style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">
        ℹ️ No pending action required by your current role (${roleData.title}) in this stage.
      </div>
    `;
  } else {
    actionsContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.75rem; width:100%;">
        <div class="form-group">
          <label for="actionCommentInput" style="font-size:0.8rem; color:var(--text-secondary);">
            Official Remarks / Review Justification (Recorded in Audit Ledger):
          </label>
          <input type="text" id="actionCommentInput" class="form-control" placeholder="Enter endorsement comments, review suggestions or approval grounds...">
        </div>
        <div style="display:flex; gap:0.6rem; justify-content:flex-end; flex-wrap:wrap;">
          ${availableActions.map(act => `
            <button class="btn btn-${act.variant}" onclick="executeWorkflowAction('${act.key}')">
              ${act.label}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  openModal("workflowDetailModal");
}

function executeWorkflowAction(actionKey) {
  const wfId = AppState.selectedWorkflowId;
  const commentInput = document.getElementById("actionCommentInput");
  const comment = commentInput ? commentInput.value.trim() : "";
  const roleData = getCurrentRoleData();

  if ((actionKey === "REQUEST_REVISION" || actionKey === "REJECT") && !comment) {
    alert("Please enter a mandatory justification comment for requesting revision or rejecting.");
    return;
  }

  try {
    const updatedWf = workflowEngine.transition(
      wfId, 
      actionKey, 
      comment, 
      AppState.currentRoleKey, 
      roleData
    );

    closeModal("workflowDetailModal");
    showToast("Workflow Updated", `Action ${actionKey} executed successfully on [${updatedWf.id}]`, "success");
    renderApp();
  } catch (err) {
    alert("Transition Error: " + err.message);
  }
}

/* ==========================================================================
   NEW SUBMISSION MODAL
   ========================================================================== */
function openNewSubmissionModal() {
  const roleData = getCurrentRoleData();
  const catSelect = document.getElementById("newSubCategory");
  const guideSelect = document.getElementById("newSubProposedGuide");

  // Populate faculty choices
  const facultyList = allocationEngine.getFacultyList();
  if (guideSelect) {
    guideSelect.innerHTML = facultyList.map(f => `
      <option value="${f.id}">${f.name} (${f.specializations[0]})</option>
    `).join("");
  }

  // Pre-select category based on role
  if (AppState.currentRoleKey === "UG_STUDENT") {
    catSelect.value = "UG";
  } else if (AppState.currentRoleKey === "PG_STUDENT") {
    catSelect.value = "PG";
  }

  openModal("newSubmissionModal");
}

function submitNewProposalForm(e) {
  e.preventDefault();
  const roleData = getCurrentRoleData();

  const title = document.getElementById("newSubTitle").value.trim();
  const category = document.getElementById("newSubCategory").value;
  const type = document.getElementById("newSubType").value;
  const domain = document.getElementById("newSubDomain").value.trim();
  const abstract = document.getElementById("newSubAbstract").value.trim();
  const proposedGuideId = document.getElementById("newSubProposedGuide").value;

  if (!title || !abstract) {
    alert("Please fill in all mandatory fields (Title and Abstract).");
    return;
  }

  const payload = {
    title,
    category,
    type,
    domain,
    abstract,
    proposedGuideId,
    teamMembers: AppState.currentRoleKey === "UG_STUDENT" ? [roleData.name, "Priya Sharma (048)", "Aditya Nair (053)"] : [roleData.name]
  };

  const newWf = workflowEngine.createWorkflow(payload, AppState.currentRoleKey, roleData);
  closeModal("newSubmissionModal");
  showToast("Proposal Submitted", `New workflow [${newWf.id}] initiated and routed to Faculty Guide.`, "success");
  
  navigateToView("ugpg_desk");
}

/* ==========================================================================
   RUBRIC SCORING MODAL
   ========================================================================== */
let activeScoringWfId = null;
let activeScoringMilestoneId = null;

function openRubricScoringModal(workflowId, milestoneId) {
  const wf = workflowEngine.getById(workflowId);
  const milestone = wf.milestones.find(m => m.id === milestoneId);
  if (!wf || !milestone) return;

  activeScoringWfId = workflowId;
  activeScoringMilestoneId = milestoneId;

  document.getElementById("rubricModalTitle").textContent = `Rubric Assessment: ${milestone.name}`;
  document.getElementById("rubricModalSubtitle").textContent = `Candidate: ${wf.submittedBy.name} • ${wf.title}`;

  const container = document.getElementById("rubricCriteriaContainer");
  container.innerHTML = EVALUATION_RUBRICS.map(r => {
    const prevVal = (milestone.rubricScores && milestone.rubricScores[r.key]) || Math.round(r.max * 0.85);

    return `
      <div class="rubric-row">
        <div class="rubric-header">
          <span>${r.label} (Max: ${r.max})</span>
          <span class="rubric-score-display" id="val_${r.key}">${prevVal} / ${r.max}</span>
        </div>
        <ul style="font-size:0.75rem; color:var(--text-muted); padding-left:1.2rem; margin-bottom:0.25rem;">
          ${r.criteria.map(c => `<li>${c}</li>`).join("")}
        </ul>
        <input type="range" class="range-slider" id="slider_${r.key}" min="0" max="${r.max}" value="${prevVal}" 
               oninput="updateRubricLiveScore('${r.key}', this.value, ${r.max})">
      </div>
    `;
  }).join("");

  document.getElementById("rubricFeedbackInput").value = milestone.feedback || "";
  computeRubricTotal();

  openModal("rubricScoringModal");
}

function updateRubricLiveScore(key, val, max) {
  const display = document.getElementById(`val_${key}`);
  if (display) display.textContent = `${val} / ${max}`;
  computeRubricTotal();
}

function computeRubricTotal() {
  let total = 0;
  EVALUATION_RUBRICS.forEach(r => {
    const slider = document.getElementById(`slider_${r.key}`);
    if (slider) total += Number(slider.value || 0);
  });

  const totalEl = document.getElementById("rubricTotalDisplay");
  const gradeBadge = document.getElementById("rubricGradeBadge");
  if (totalEl) totalEl.textContent = `${total} / 100`;

  if (gradeBadge) {
    if (total >= 90) { gradeBadge.textContent = "Outstanding (O / A+)"; gradeBadge.style.color = "var(--status-approved)"; }
    else if (total >= 80) { gradeBadge.textContent = "Very Good (A)"; gradeBadge.style.color = "var(--accent-cyan)"; }
    else if (total >= 65) { gradeBadge.textContent = "Satisfactory (B)"; gradeBadge.style.color = "var(--status-pending)"; }
    else { gradeBadge.textContent = "Re-defense Required"; gradeBadge.style.color = "var(--status-rejected)"; }
  }
}

function saveRubricEvaluation() {
  const scores = {};
  EVALUATION_RUBRICS.forEach(r => {
    const slider = document.getElementById(`slider_${r.key}`);
    scores[r.key] = Number(slider ? slider.value : 0);
  });

  const feedback = document.getElementById("rubricFeedbackInput").value.trim();
  const evaluatorData = getCurrentRoleData();

  workflowEngine.evaluateMilestone(activeScoringWfId, activeScoringMilestoneId, scores, feedback, evaluatorData);
  closeModal("rubricScoringModal");
  showToast("Evaluation Graded", "Rubric assessment and oral feedback recorded into student transcript.", "success");
  renderApp();
}

/* ==========================================================================
   ALLOCATION ENGINE ACTIONS (GALE-SHAPLEY / MATCHING)
   ========================================================================== */
function runAutomatedAllocationSimulation() {
  const consoleEl = document.getElementById("simulationConsoleOutput");
  if (consoleEl) {
    consoleEl.style.display = "block";
    consoleEl.innerHTML = `<div>🚀 Launching Gale-Shapley Stable Matching Engine...</div>`;
  }

  setTimeout(() => {
    const res = allocationEngine.runAutomatedMatching();
    if (consoleEl) {
      consoleEl.innerHTML = res.logs.map(l => `<div class="console-line">${escapeHtml(l)}</div>`).join("");
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    showToast("Allocation Complete", "Stable matching simulation finished with 100% capacity balance.", "success");
    renderAllocation();
  }, 400);
}

function resetAllocationEngine() {
  if (confirm("Reset all project allocations to default initial state?")) {
    allocationEngine.resetAllocations();
    showToast("Reset Done", "All allocations reverted to baseline seed.", "info");
    renderAllocation();
  }
}

function openManualOverrideModal(teamId) {
  const team = allocationEngine.getTeams().find(t => t.teamId === teamId);
  if (!team) return;

  const select = document.getElementById("overrideFacultySelect");
  const facultyList = allocationEngine.getFacultyList();
  select.innerHTML = facultyList.map(f => `
    <option value="${f.id}" ${team.allocatedGuideId === f.id ? 'selected' : ''}>${f.name} (${f.designation})</option>
  `).join("");

  document.getElementById("overrideTeamIdHidden").value = teamId;
  document.getElementById("overrideTeamTitle").textContent = `${team.teamId}: ${team.title}`;
  openModal("manualOverrideModal");
}

function submitManualOverrideForm(e) {
  e.preventDefault();
  const teamId = document.getElementById("overrideTeamIdHidden").value;
  const newGuideId = document.getElementById("overrideFacultySelect").value;
  const reason = document.getElementById("overrideReasonInput").value;
  const roleData = getCurrentRoleData();

  allocationEngine.manualOverride(teamId, newGuideId, reason, roleData.name);
  closeModal("manualOverrideModal");
  showToast("Override Applied", `Assigned ${teamId} to new guide with audit justification.`, "success");
  renderAllocation();
}

/* ==========================================================================
   OFFICIAL SANCTION LETTER EXPORT (HOD / PRINT READY)
   ========================================================================== */
function exportSanctionLetter() {
  const wfId = AppState.selectedWorkflowId;
  const wf = workflowEngine.getById(wfId);
  if (!wf) return;

  const guide = wf.details.allocatedGuideId ? allocationEngine.getFacultyById(wf.details.allocatedGuideId) : null;
  const letterBody = document.getElementById("sanctionLetterBody");

  letterBody.innerHTML = `
    <div style="font-family:'Times New Roman', serif; color:#000; line-height:1.6; padding:2rem; background:#fff; border:1px solid #ccc;">
      <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:1rem; margin-bottom:1.5rem;">
        <h2 style="font-size:1.4rem; text-transform:uppercase; margin-bottom:2px;">Department of Information Technology</h2>
        <h4 style="font-size:1rem; font-weight:normal;">Faculty of Engineering & Technology • State University</h4>
        <div style="font-size:0.8rem; color:#555;">Ref. No: IT/PROJ/SANCT/2026/${wf.id} • Date: ${new Date().toLocaleDateString()}</div>
      </div>

      <h3 style="text-align:center; text-decoration:underline; font-size:1.15rem; margin-bottom:1.5rem;">
        OFFICIAL SANCTION ORDER & PROJECT CLEARANCE
      </h3>

      <p style="text-align:justify; margin-bottom:1rem;">
        Pursuant to the recommendations of the Departmental Project Committee and verification of faculty supervisory quotas, approval of the undersigned is hereby accorded for the conduct of the project detailed hereunder:
      </p>

      <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; font-size:0.95rem;">
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold; width:30%;">Workflow Tracking ID:</td><td style="padding:6px; border:1px solid #000;">${wf.id}</td></tr>
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold;">Project Title:</td><td style="padding:6px; border:1px solid #000;">${wf.title}</td></tr>
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold;">Principal Investigator / Lead:</td><td style="padding:6px; border:1px solid #000;">${wf.submittedBy.name} (${wf.submittedBy.degree || wf.submittedBy.rollNo})</td></tr>
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold;">Designated Faculty Guide:</td><td style="padding:6px; border:1px solid #000;">${guide ? guide.name + " (" + guide.designation + ")" : "Dr. Vikramaditya Das"}</td></tr>
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold;">Specialization Track:</td><td style="padding:6px; border:1px solid #000;">${wf.details.domain || "General IT"}</td></tr>
        <tr><td style="padding:6px; border:1px solid #000; font-weight:bold;">Clearance Status:</td><td style="padding:6px; border:1px solid #000; color:green; font-weight:bold;">OFFICIALLY SANCTIONED</td></tr>
      </table>

      <p style="text-align:justify; margin-bottom:2rem;">
        The candidate/team is directed to report to the allocated faculty guide and adhere strictly to the Continuous Assessment Rubrics & Milestones scheduled by the project convener.
      </p>

      <div style="display:flex; justify-content:space-between; margin-top:3rem;">
        <div>
          <div style="font-weight:bold;">Dr. Ananya Roy</div>
          <div style="font-size:0.85rem;">Project Convener (UG/PG)</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:bold;">Prof. (Dr.) Rajeshwar Sen</div>
          <div style="font-size:0.85rem;">Head of Department (IT)</div>
          <div style="font-size:0.75rem; color:#666;">Digitally Signed via DAWMS Portal</div>
        </div>
      </div>
    </div>
  `;

  openModal("sanctionLetterModal");
}

function printSanctionLetter() {
  const content = document.getElementById("sanctionLetterBody").innerHTML;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`<html><head><title>Department Sanction Order</title></head><body>${content}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

/* ==========================================================================
   SYSTEM AUDIT JSON EXPORT & RESET
   ========================================================================== */
function exportFullSystemAudit() {
  const exportData = {
    exportedAt: new Date().toISOString(),
    system: "Departmental Activity & Workflow Management System (DAWMS)",
    activeRole: AppState.currentRoleKey,
    workflows: workflowEngine.getAll(),
    teams: allocationEngine.getTeams(),
    faculty: allocationEngine.getFacultyList()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `DAWMS_Audit_Export_${Date.now()}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();

  showToast("Audit Exported", "Complete JSON audit log downloaded to your local machine.", "info");
}

function resetEntirePortal() {
  if (confirm("Reset the entire portal database back to initial laboratory state? All modifications will be cleared.")) {
    DeptStore.reset();
    workflowEngine = new WorkflowEngine(DeptStore);
    allocationEngine = new AllocationEngine(DeptStore);
    allocationEngine.calculateQuotas();
    showToast("Portal Reset", "Laboratory database restored to default seed state.", "warning");
    renderApp();
  }
}

/* ==========================================================================
   MODAL UTILITIES & EVENT BINDINGS
   ========================================================================== */
function initModals() {
  document.querySelectorAll(".modal-close, .modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("active");
    }
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

/* ==========================================================================
   ACTIONS & FILTERS INITIALIZATION
   ========================================================================== */
function initActions() {
  // Filter pills in approvals view
  document.querySelectorAll(".filter-pill[data-filter]").forEach(pill => {
    pill.addEventListener("click", () => {
      AppState.activeFilter = pill.getAttribute("data-filter");
      renderApprovals();
    });
  });

  // Search Input in Approvals
  const searchInput = document.getElementById("workflowSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      AppState.activeSearchQuery = e.target.value;
      renderApprovals();
    });
  }

  // New Submission Form
  const newSubForm = document.getElementById("newSubmissionForm");
  if (newSubForm) {
    newSubForm.addEventListener("submit", submitNewProposalForm);
  }

  // Manual Override Form
  const overrideForm = document.getElementById("manualOverrideForm");
  if (overrideForm) {
    overrideForm.addEventListener("submit", submitManualOverrideForm);
  }

  // Notification Bell Toggle
  const notifBtn = document.getElementById("notifButton");
  const notifDropdown = document.getElementById("notifDropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = notifDropdown.style.display === "block";
      notifDropdown.style.display = isVisible ? "none" : "block";

      if (!isVisible) {
        renderNotificationsDropdown();
        workflowEngine.markAllNotificationsRead();
        updateNotificationCount();
      }
    });

    document.addEventListener("click", () => {
      notifDropdown.style.display = "none";
    });
  }
}

function renderNotificationsDropdown() {
  const notifs = workflowEngine.getNotifications(AppState.currentRoleKey);
  const container = document.getElementById("notifListContainer");
  if (!container) return;

  if (notifs.length === 0) {
    container.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.8rem;">No notifications for this role.</div>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div style="padding:0.85rem 1rem; border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:0.2rem; cursor:pointer;"
         onclick="openWorkflowDetailModal('${n.workflowId}')">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:0.8rem; color:#fff;">${n.title}</strong>
        <span style="font-size:0.68rem; color:var(--text-muted);">${n.timestamp}</span>
      </div>
      <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">${n.message}</p>
    </div>
  `).join("");
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
function showToast(title, message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast`;

  const iconMap = {
    success: "✅",
    warning: "⚠️",
    error: "❌",
    info: "⚡"
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || "⚡"}</div>
    <div class="toast-body">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
