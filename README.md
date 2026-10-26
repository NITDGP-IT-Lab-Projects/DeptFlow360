# DeptFlow 360 — Departmental Activity & Workflow Management System
> **Semester 7 Information Technology Engineering Lab — Project 7**  
> **System Focus**: Workflow-Based Architecture & Software Interface Design for Academic ERP, Multi-Tier Approvals & Project Allocation Management.

---

## 1. Project Overview & Architectural Vision
In higher education academic departments, operational workflows (UG Capstone allocations, PG Dissertation defenses, Faculty supervisory quotas, Research Advisory Committee reviews, Leave/NOCs, and Laboratory equipment requisitions) are frequently fragmented across disparate paperwork, emails, and static spreadsheets. 

**DeptFlow 360** transforms departmental administration from static CRUD data storage into a **deterministic, event-driven workflow engine**. Every academic action is modeled as a state machine instance subject to:
1. **Role-Based Access Control (RBAC)** capabilities.
2. **Dynamic supervisory capacity guards** (preventing faculty overload).
3. **Immutable, timestamped audit trail records** with justification remarks.
4. **Interactive continuous assessment rubrics** aligned with ABET/NBA engineering outcome accreditation.

---

## 2. System Architecture & Software Interface Design

### 2.1 Workflow State Machine Architecture
Every departmental request follows a formalized finite state automaton:

```
[DRAFT]
   │
   ▼ (Student / Submitter Dispatches)
[UNDER_GUIDE_REVIEW] ──────(Clarification Needed)──────► [REVISION_REQUESTED]
   │                                                             │
   │ (Faculty Endorses & Evaluates Feasibility)                  │ (Student Corrects & Resubmits)
   ▼                                                             │
[UNDER_COORDINATOR_REVIEW] ◄─────────────────────────────────────┘
   │
   │ (Coordinator Verifies Quotas, Tracks & Panel Formations)
   ▼
[UNDER_HOD_REVIEW]
   │
   ├──────► [APPROVED / OFFICIALLY SANCTIONED] (Triggers Milestones & Sanction Order)
   │
   └──────► [REJECTED] (Terminal State with Mandatory Audit Grounds)
```

### 2.2 Core Software Interface Contracts
The application enforces clear decoupled interfaces across modular components:

- **`IWorkflowItem`**: Holds lifecycle state, tracking ID, submitter information, domain categorization, SLA countdown timer, continuous milestones, and chronological history log.
- **`IFaculty`**: Encapsulates supervisory quotas (`ugQuotaMax`, `ugQuotaCurrent`, `pgQuotaMax`, `pgQuotaCurrent`), research specializations, office hours, and allocated candidate rosters.
- **`IProjectTeam`**: Represents student project consortia with average CGPA, domain specialization, ranked guide preferences (Choices #1, #2, #3), and allocation state.
- **`IEvaluationRubric`**: NBA/ABET aligned criteria vectors:
  - *Literature Review & Problem Formulation* (30 pts)
  - *Technical Rigor, Architecture & Methodology* (40 pts)
  - *Viva Voce Demonstration & Q&A* (30 pts)
- **`DeptStore`**: Isolated, resilient local storage engine with automatic JSON serialization, error recovery, and full database export/restore capabilities.

---

## 3. Project Allocation Management: Gale-Shapley Algorithm

A central feature of the software is the **Preference-Based Matching Engine**:
1. **Priority Sorting**: Student teams are queued according to merit (Team Average CGPA descending).
2. **Quota Constraint Check**: When matching teams to faculty preferences:
   - If Choice #1 has available capacity in their supervisory quota, the allotment is immediately confirmed.
   - If Choice #1 is oversubscribed, the slot is awarded to higher-merit teams, and subsequent teams automatically cascade to Choice #2 or #3 without human error.
3. **Fallback & Balance**: If all preferences are exhausted, the engine balances loads across eligible faculty members with remaining domain-relevant capacity.
4. **Administrative Override**: The Project Convener or HOD can execute manual overrides with mandatory justification comments permanently recorded in the audit ledger.

---

## 4. Multi-Role Switchboard (Interactive Lab Demonstration)

The top header provides an instant **Role Switcher** allowing examiners and users to evaluate the end-to-end multi-tier pipeline without switching user accounts or re-seeding databases:

| Persona | Role Key | Operating Scope in DeptFlow 360 |
|---|---|---|
| **Dr. Rajeshwar Sen** | `HOD` | Final executive sanction on proposals, budget requisitions, departmental analytics, and issuing Official Sanction Orders. |
| **Dr. Ananya Roy** | `COORDINATOR` | Project Convener desk, running automated project allocation matching, panel scheduling, and quota monitoring. |
| **Dr. Vikramaditya Das** | `FACULTY` | Faculty guide reviewing advisee proposals, continuous milestone defense grading via interactive rubrics, and feedback logging. |
| **Sneha Mukherjee** | `PG_STUDENT` | M.Tech scholar submitting dissertation synopsis, RAC review progress reports, and industrial research NOCs. |
| **Rahul Verma & Team** | `UG_STUDENT` | B.Tech final-year capstone team tracking live multi-step approval progress, submitting proposals, and viewing rubric grades. |

---

## 5. File Structure

```
d:/Technical/Sem7_IT_Lab/Project7/
├── index.html                   # High-polish Single Page Application layout & viewports
├── css/
│   └── styles.css               # Modern dark slate & glassmorphism CSS design system
├── js/
│   ├── data.js                  # Initial seed records (Faculty, Teams, Workflows, Rubrics) & DeptStore
│   ├── workflowEngine.js        # Deterministic state machine, RBAC guards, and notifications
│   ├── allocationEngine.js      # Gale-Shapley preference matching & quota manager
│   └── app.js                   # Application coordinator, view transitions, and interactive modals
├── docs/
│   └── ARCHITECTURE_AND_DESIGN.md # Detailed technical specification & UML/State diagrams
└── README.md                    # Project documentation & Lab Viva Voce reference
```

---

## 6. How to Run Locally

Because the system is engineered with self-contained, zero-install modern web standards:
1. Double-click `index.html` or open `file:///d:/Technical/Sem7_IT_Lab/Project7/index.html` in Google Chrome, Microsoft Edge, Mozilla Firefox, or any modern browser.
2. No Node.js server, Python backend, or database setup is required—the entire reactive engine runs with instant persistence in the browser.

---

## 7. Key Features & Verification Steps

1. **Dashboard KPIs**: Real-time counts of active workflows, pending tier approvals, sanctioned projects, and quota load percentage.
2. **Multi-Stage Approvals Inbox**:
   - Filter by *Needs My Action*, *UG Capstones*, *PG Dissertations*, or *Sanctioned*.
   - Click any item to launch the **Workflow Detail Modal**, showcasing the **Visual Stepper Progress Bar** and full **Audit Ledger**.
   - Contextual action buttons (`Grant HOD Sanction`, `Endorse & Forward`, `Request Revision`, `Reject`) update dynamically based on the active role.
3. **Automated Project Allocation**:
   - Navigate to *Project Allocation*.
   - Click `⚡ Run Automated Matcher` to watch the step-by-step console simulate Gale-Shapley matching and update faculty quota progress bars.
4. **Defense & Rubric Evaluation**:
   - Open *Defense & Rubrics* to test interactive slider scoring with live ABET/NBA score calculation (`Outstanding`, `Very Good`, `Satisfactory`).
5. **Official Sanction Order Generation**:
   - In any approved workflow modal, click `📄 Generate Sanction Letter` to preview a print-ready university letterhead order with digital signatures.
6. **Data Portability**:
   - Click the `💾` topbar icon to export the complete state ledger as an authenticated JSON file.
   - Click `🔄` to reset the database back to default laboratory baseline at any time.

---

## 8. University Lab Viva Voce Q&A Reference

### Q1: Why use a Workflow-Based Architecture instead of simple CRUD database tables?
**Answer:** Academic activities are non-linear, multi-stakeholder processes with legal and regulatory ramifications. A basic CRUD database allows arbitrary writes and lacks state transition history. A workflow-based architecture enforces **finite deterministic states**, ensures **only authorized actors can trigger specific transitions**, maintains a **tamper-evident audit ledger**, and prevents illegal bypasses (e.g., an unallocated or unverified project cannot be accidentally approved by the HOD).

### Q2: How does the Project Allocation algorithm prevent faculty burnout/overload?
**Answer:** The allocation engine implements strict capacity guards (`ugQuotaMax`, `pgQuotaMax`). During preference-based bidding, if a faculty member's quota is exhausted by higher-merit student teams, the engine systematically cascades lower-ranked teams to their secondary choices rather than exceeding the quota.

### Q3: How is RBAC enforced on the client side?
**Answer:** In `workflowEngine.js`, the method `getAvailableActions()` cross-references `activeRoleKey`, `activeRoleData.id`, and `workflow.state` against defined permission vectors. Actions such as `HOD_APPROVE` are physically stripped from the DOM and blocked in the transition validator if invoked by unauthorized roles.
