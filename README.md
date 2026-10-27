# DeptFlow 360 — Departmental Activity & Workflow Management System
> **Semester 7 Information Technology Engineering Lab — Project 7**  
> **System Focus**: Workflow-Based Architecture, Strict Sequential Clearance Chains, Dynamic Zero-Sample-Data Lifecycle, Role-Based Access Control (RBAC), and Gale-Shapley Project Allocation.

---

## 1. Project Overview & Architectural Vision
In higher education academic departments, operational workflows (UG Capstone allocations, PG Dissertation defenses, Faculty supervisory quotas, Research Advisory Committee reviews, Leave/NOCs, and Laboratory equipment requisitions) are frequently fragmented across disparate paperwork, emails, and static spreadsheets. 

**DeptFlow 360** transforms departmental administration from static CRUD data storage into a **deterministic, event-driven workflow engine**. Every academic action is modeled as a state machine instance subject to:
1. **Strict Sequential Review Clearance**: Uncompromising legal hierarchy order (`Student / Submitter -> Faculty Guide -> Project Coordinator -> Head of Department -> Approved`).
2. **Zero-Sample-Data Dynamic Baseline**: Secure onboarding with dynamic user registration, bcrypt salted password hashing, and JWT token issuance.
3. **Role-Based Access Control (RBAC) & Authority Scope Isolation**: Strict actor role validation preventing bypasses, unauthorized expediting, or out-of-order clearance.
4. **Dynamic Supervisory Capacity Guards**: Real-time quota monitoring and Gale-Shapley matching preventing faculty burnout.
5. **Interactive Proposal Revision Loop**: Submitter resubmission capabilities with mandatory re-entry at Tier-1 Guide review.
6. **Immutable, Timestamped Audit Trail**: Cryptographically verifiable ledger tracking every actor, transition status, and justification comment.
7. **Interactive Assessment Rubrics**: Aligned with ABET/NBA engineering outcome accreditation vectors.

---

## 2. System Architecture & Software Interface Design

### 2.1 Formal Workflow State Machine Architecture
Every departmental request—regardless of whether filed by a Student, Faculty Guide, or Coordinator, and across all classifications (`UG`, `PG`, `DEPARTMENTAL`)—unconditionally enters the state machine at `UNDER_GUIDE_REVIEW`:

```
              [DRAFT]
                 │
                 ▼ (Submitter: Student / Faculty / Coordinator Dispatches)
      ┌─────────────────────────────────────────────────────────────────┐
  ┌──►│                      [UNDER_GUIDE_REVIEW]                       │
  │   └──────────────────────────────┬──────────────────────────────────┘
  │                                  │ (Designated Faculty Guide Endorsement Only)
  │                                  ▼
  │                      [UNDER_COORDINATOR_REVIEW]
  │                                  │ (Project Coordinator Verification Only)
  │                                  ▼
  │                            [UNDER_HOD_REVIEW]
  │                                  │
  │                 ┌────────────────┴────────────────┐
  │                 │                                 │
  │                 ▼ (HOD Sanction)                  ▼ (Terminal Decline)
  │       [APPROVED / SANCTIONED]                [REJECTED]
  │
  │   (Revision Requested by Any Tier: Guide / Coordinator / HOD)
  │                 │
  │                 ▼
  │        [REVISION_REQUESTED]
  │                 │
  └─────────────────┴ (Submitter Edits Proposal & Resubmits -> Re-enters at Guide Review)
```

### 2.2 Strict Sequential Clearance Rules & Invariant Matrix
Bypassing supervisory tiers is strictly illegal and architecturally impossible:

| Current Workflow State | Permitted Action Key | Authorized Role | Next State | Security & Invariant Rules Enforced |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` / `NEW` | `SUBMIT` | `STUDENT`, `FACULTY`, `COORDINATOR` | `UNDER_GUIDE_REVIEW` | All submissions unconditionally initialize at Guide Review. Direct jump to Coordinator/HOD is blocked. |
| `UNDER_GUIDE_REVIEW` | `GUIDE_ENDORSE` / `GUIDE_APPROVE` | `FACULTY` (Designated Guide) | `UNDER_COORDINATOR_REVIEW` | **Guide Bypass Blocked**: Coordinator and HOD are strictly forbidden from endorsing on behalf of Guide. Returns `HTTP 400`. |
| `UNDER_GUIDE_REVIEW` | `COORDINATOR_EXPEDITE` | *Blocked for All* | *N/A* | **Expedite Prohibited**: Any attempt by Coordinator to expedite past guide review is rejected with `HTTP 400`. |
| `UNDER_GUIDE_REVIEW` | `REQUEST_REVISION` / `REJECT` | `FACULTY` | `REVISION_REQUESTED` / `REJECTED` | Premature intervention by Coordinator or HOD while under guide review is rejected with `HTTP 400`. |
| `UNDER_COORDINATOR_REVIEW` | `COORDINATOR_VERIFY` / `COORDINATOR_FORWARD` | `COORDINATOR` | `UNDER_HOD_REVIEW` | Verifies quotas, prerequisites, and tracks. HOD or Guide cannot trigger this transition. |
| `UNDER_COORDINATOR_REVIEW` | `REQUEST_REVISION` / `REJECT` | `COORDINATOR` | `REVISION_REQUESTED` / `REJECTED` | Faculty Guide cannot alter proposal once endorsed to Coordinator. |
| `UNDER_HOD_REVIEW` | `HOD_APPROVE` / `HOD_SANCTION` | `HOD` | `APPROVED` | Final official sanction. Premature sanction before Guide/Coordinator clearance returns `HTTP 400`. |
| `UNDER_HOD_REVIEW` | `REQUEST_REVISION` / `REJECT` | `HOD` | `REVISION_REQUESTED` / `REJECTED` | Only the Head of Department holds review authority in this tier. |
| `REVISION_REQUESTED` | `STUDENT_RESUBMIT` / `RESUBMIT` | Submitter (`STUDENT`, etc.) | `UNDER_GUIDE_REVIEW` | Submitter edits title, domain, abstract, and guide. **Must re-enter clearance chain at Guide Review**. |
| `APPROVED` / `REJECTED` | *Terminal* | *None* | *None* | Terminal states are locked. Re-sanctioning or resubmitting an approved proposal returns `HTTP 400`. |

---

## 3. Project Allocation Management: Gale-Shapley Algorithm

A core engineering capability of DeptFlow 360 is the **Preference-Based Matching Engine**:
1. **Priority Sorting**: Student teams are ranked strictly by Cumulative Grade Point Average (CGPA descending).
2. **Quota Constraint Verification**: When matching teams against faculty supervisory quotas:
   - If Choice #1 has available capacity in their supervisory quota (`ugQuotaCurrent < ugQuotaMax`), the allotment is immediately confirmed.
   - If Choice #1 is oversubscribed, higher-merit teams win the slots; lower-ranked teams automatically cascade to Choice #2 or #3 without manual paperwork.
3. **Load Balancing & Allocation Fallback**: If all preferences are exhausted, the engine balances loads across eligible faculty members with remaining domain-relevant capacity.
4. **Administrative Override with Audit Trail**: The Coordinator or HOD can execute manual mentor reassignments with mandatory justification comments permanently recorded in the immutable audit ledger.

---

## 4. User Personas, RBAC Scope & Authentication

The system supports dynamic account registration with bcrypt password hashing and JWT sessions. Each authenticated role operates under an isolated functional scope:

| Persona Role | Role Key | Functional Scope & Access Permissions |
| :--- | :--- | :--- |
| **Head of Department** | `HOD` | Final executive sanction on proposals, budget requisitions, departmental analytics, and issuing Official Sanction Orders (`PDF/Print`). |
| **Project Coordinator** | `COORDINATOR` | Project Convener desk, executing automated Gale-Shapley matching, verifying academic tracks, and forwarding to HOD. |
| **Faculty Guide** | `FACULTY` | Reviewing and endorsing assigned advisee proposals, continuous milestone defense grading via interactive rubrics, and feedback logging. |
| **PG Scholar** | `PG_STUDENT` | Submitting dissertation proposals, monitoring clearance stages, and revising synopses upon review feedback. |
| **UG Student** | `UG_STUDENT` | Submitting capstone project proposals, monitoring multi-tier progress, revising proposals, and tracking continuous milestone scores. |

---

## 5. Repository File Structure

```
d:/Technical/Sem7_IT_Lab/Project7/
├── index.html                   # High-polish Vite HTML entry point & viewport mounting root
├── vite.config.mjs              # Vite bundler configuration with React plugin and /api proxy
├── package.json                 # Project dependencies (React 18, Vite), scripts & engine specs
├── css/
│   └── styles.css               # Modern dark slate & glassmorphism CSS design system
├── src/
│   ├── main.jsx                 # React DOM createRoot entry point
│   ├── App.jsx                  # Main SPA layout coordinator, view switcher & modals
│   ├── context/
│   │   └── AppContext.jsx       # Reactive role switcher, state machine context & API sync
│   ├── services/
│   │   └── api.js               # Express backend REST client with fallback to local store
│   ├── engine/                  # Core deterministic logic engines (ES modules)
│   │   ├── data.js              # Initial role vectors and evaluation rubrics
│   │   ├── workflowEngine.js    # Finite state machine & audit trail engine
│   │   └── allocationEngine.js  # Gale-Shapley preference-based matching engine
│   └── components/
│       ├── AuthScreen.jsx       # Clean-slate user registration & authentication screen
│       ├── Sidebar.jsx          # Glassmorphic sidebar navigation & backend sync status
│       ├── Topbar.jsx           # User profile badge, notification popover & quick actions
│       ├── Toast.jsx            # Animated toast alert notification stack
│       ├── views/               # Dynamic responsive viewports
│       │   ├── DashboardView.jsx    # Authority directives, KPI cards & live audit stream
│       │   ├── ApprovalsView.jsx    # Multi-tier inbox with domain filtering & SLA meters
│       │   ├── AllocationView.jsx   # Quota progress bars, live matcher console & overrides
│       │   ├── UgPgDeskView.jsx     # Student project tracks & milestone defenses
│       │   ├── RubricEvalView.jsx   # ABET/NBA continuous scoring sliders (3 dimensions)
│       │   ├── FacultyDirView.jsx   # Faculty directory, research domains & advisee lists
│       │   └── ArchitectureView.jsx # Finite state automaton diagram & RBAC capability matrix
│       └── modals/              # Interactive dialogs & wizards
│           ├── WorkflowDetailModal.jsx # Visual stepper progress, audit ledger & revision editor
│           ├── NewSubmissionModal.jsx  # Proposal dispatch form
│           ├── RubricScoringModal.jsx  # Interactive criteria sliders & letter grade
│           ├── ManualOverrideModal.jsx # Mentor reassignment dialog with justification
│           └── SanctionLetterModal.jsx # University memorandum order with print/PDF
├── server/                      # Express REST API & MongoDB Atlas Backend
│   ├── server.js                # Express application listening on 0.0.0.0:5000
│   ├── config/db.js             # Mongoose connection to MongoDB Atlas / local MongoDB
│   ├── utils/auth.js            # Bcrypt password hashing & JWT token generator
│   ├── models/                  # Workflow, Faculty, ProjectTeam, User, Notification schemas
│   ├── controllers/             # REST controllers for auth, workflows, allocation & faculty
│   ├── routes/                  # Express routing modules (/api/auth, /api/workflows, etc.)
│   ├── scripts/
│   │   └── testAllWorkflowPaths.js # Automated E2E test suite covering all 7 paths + negative tests
│   └── Dockerfile               # Production Node 20 Alpine backend container
├── Dockerfile                   # Multi-stage Dockerfile (Node 20 builder -> Nginx Alpine runtime)
├── docker-compose.yml           # Multi-container orchestration (backend + frontend + mongodb)
├── nginx.conf                   # Hardened Nginx reverse proxy with /healthz and /api routing
├── .github/workflows/ci.yml     # Complete CI/CD matrix pipeline with live container E2E validation
└── tests/                       # Unit tests & syntax verification suite
    ├── workflowEngine.test.js   # Unit tests for WorkflowEngine, strict hierarchy & bypass prevention
    ├── allocationEngine.test.js # Unit tests for Gale-Shapley matching & quota guards
    └── syntax-check.js          # Static asset, React structure & JavaScript syntax validator
```

---

## 6. Execution Options

### Option A: Local Development Server
```bash
# 1. Install frontend and backend dependencies
npm install
cd server && npm install && cd ..

# 2. Start Express Backend
cd server
npm run dev # Runs on http://localhost:5000

# 3. Start Vite Frontend Development Server (in separate terminal)
npm run dev # Runs on http://localhost:5173 with proxy to backend
```

### Option B: Multi-Container Docker Stack
```bash
# Build and launch complete containerized stack (Frontend + Backend + MongoDB)
docker compose up -d --build

# Verify container health
curl http://localhost:8080/healthz     # Frontend Nginx Web Server -> OK
curl http://localhost:8080/api/health  # Backend Express API Proxy -> OK

# Access application
Navigate to http://localhost:8080 in browser
```

---

## 7. Automated Testing & Continuous Integration (CI)

### 7.1 Running Tests Locally
The project includes a comprehensive unit and end-to-end test suite:

```bash
# 1. Run static asset integrity and JavaScript syntax validation
npm run test:syntax

# 2. Run core engine unit tests (WorkflowEngine, strict hierarchy & Gale-Shapley)
npm test

# 3. Run complete automated 7-path E2E lifecycle test against live backend
node server/scripts/testAllWorkflowPaths.js

# 4. Build React production bundle
npm run build
```

### 7.2 GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)
Every code commit and pull request triggers a rigorous automated verification pipeline:

1. **Job 1: Unit Tests & Code Integrity Matrix (`test-and-lint`)**:
   - Executes across **Node.js 18.x, 20.x, and 22.x**.
   - Validates syntax, React component structures, and static assets.
   - Executes all unit tests for deterministic state transitions, hierarchy guards, and Gale-Shapley matching.
   - Builds the production React SPA bundle.

2. **Job 2: Docker Build & Live Container Health Check (`docker-validation`)**:
   - Deploys the multi-container stack via `docker compose`.
   - Probes `/healthz` and `/api/health` with automated retries.
   - Validates Nginx security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`).
   - Asserts a **Zero-Sample-Data Clean Slate** baseline.
   - Dynamically registers all 4 roles and verifies bcrypt password hashing and token generation.
   - Executes dynamic faculty quota provisioning and Gale-Shapley student team matching.
   - **Validates Strict Review Hierarchy Enforcement**:
     - Tests that Coordinator premature review is rejected with `HTTP 400`.
     - Tests that Coordinator attempting `GUIDE_ENDORSE` on behalf of Guide is rejected with `HTTP 400`.
     - Tests that Coordinator attempting `COORDINATOR_EXPEDITE` is rejected with `HTTP 400`.
     - Tests that HOD premature sanction on Guide review is rejected with `HTTP 400`.
     - Tests that HOD premature sanction on Coordinator review is rejected with `HTTP 400`.
     - Tests that Departmental requisitions unconditionally initialize at `UNDER_GUIDE_REVIEW`.
   - Executes continuous assessment milestone rubric scoring.
   - Tests case-insensitive and whitespace-tolerant tracking ID lookups.
   - Executes `testAllWorkflowPaths.js` validating all 7 review paths and revision loops.

---

## 8. Verified End-to-End Clearance Paths

DeptFlow 360 verifies and enforces all possible workflow trajectories:

1. **Path 1 (Happy Path)**: `Submit -> Guide Endorse -> Coordinator Verify -> HOD Sanction (APPROVED)`.
2. **Path 2 (Guide Revision Loop)**: `Submit -> Guide Requests Revision -> Student Edits & Resubmits -> Guide Endorse -> Coordinator Verify -> HOD Sanction (APPROVED)`.
3. **Path 3 (Guide Rejection)**: `Submit -> Guide Rejects Proposal (REJECTED)`.
4. **Path 4 (Coordinator Revision Loop)**: `Submit -> Guide Endorse -> Coordinator Requests Revision -> Student Edits & Resubmits -> Re-enters at Guide Review -> Guide Endorse -> Coordinator Verify -> HOD Sanction (APPROVED)`.
5. **Path 5 (Coordinator Rejection)**: `Submit -> Guide Endorse -> Coordinator Rejects Proposal (REJECTED)`.
6. **Path 6 (HOD Revision Loop)**: `Submit -> Guide Endorse -> Coordinator Verify -> HOD Requests Revision -> Student Edits & Resubmits -> Re-enters at Guide Review -> Full Chain Re-cleared (APPROVED)`.
7. **Path 7 (HOD Rejection)**: `Submit -> Guide Endorse -> Coordinator Verify -> HOD Rejects Proposal (REJECTED)`.

---

## 9. University Lab Viva Voce Q&A Reference

### Q1: Why is a strict sequential clearance order enforced rather than allowing coordinators or HODs to approve directly?
**Answer:** Academic accountability mandates separation of concerns. The Faculty Guide evaluates technical feasibility, domain rigor, and research methodology. The Project Coordinator monitors supervisory capacities, scheduling, and panel quotas. The HOD provides executive administrative and financial sanction. Allowing a Coordinator or HOD to bypass the Guide creates administrative liability where proposals outside a guide's expertise or without supervisory consent could be sanctioned.

### Q2: How does the system prevent a Coordinator from expediting or endorsing on behalf of a Guide?
**Answer:** Both the Express backend ([workflowController.js](file:///d:/Technical/Sem7_IT_Lab/Project7/server/controllers/workflowController.js)) and the core engine ([workflowEngine.js](file:///d:/Technical/Sem7_IT_Lab/Project7/src/engine/workflowEngine.js)) enforce bidirectional role and state invariants. The action `GUIDE_ENDORSE` rejects callers whose role is `COORDINATOR` or `HOD` with `HTTP 400`. The legacy `COORDINATOR_EXPEDITE` backdoor has been decommissioned, and any attempt to bypass guide review throws an error.

### Q3: What happens when a revision is requested by the Coordinator or HOD?
**Answer:** The workflow transitions to `REVISION_REQUESTED`. The student submitter receives an interactive revision interface allowing edits to proposal title, domain, abstract, and guide selection. Upon resubmission (`STUDENT_RESUBMIT`), the proposal **re-enters the clearance chain strictly at `UNDER_GUIDE_REVIEW`**, ensuring that all revised text is re-evaluated by the guide before administrative tiers see it.

### Q4: How does the Gale-Shapley matching algorithm guarantee Pareto-optimal project allocation?
**Answer:** Student teams submit ranked preference vectors `[Choice #1, Choice #2, Choice #3]`. Teams are prioritized by academic merit (CGPA descending). The algorithm matches each team to their highest preferred faculty member who has remaining supervisory capacity (`ugQuotaCurrent < ugQuotaMax`). If a quota fills, subsequent teams cascade to their next preference. This produces a stable matching where no student-faculty pair mutually prefers each other over their assigned allocation.

### Q5: How is data isolation maintained between students?
**Answer:** Students are strictly restricted to inspecting their own submissions (`isMySubmission`). Attempting to view proposals belonging to other students or accessing supervisory inboxes (`ApprovalsView`, `FacultyDirView`, `RubricEvalView`) is blocked and displays an authority restriction barrier directing the student back to their dedicated Submissions Desk.
