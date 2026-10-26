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
│   │   └── api.js               # Express backend REST client with fallback to local seed data
│   ├── engine/                  # Core deterministic logic engines (ES modules)
│   │   ├── data.js              # Faculty, student teams, workflows, and evaluation rubrics
│   │   ├── workflowEngine.js    # Finite state machine & audit trail engine
│   │   └── allocationEngine.js  # Gale-Shapley preference-based matching engine
│   └── components/
│       ├── Sidebar.jsx          # Glassmorphic sidebar navigation & backend sync status
│       ├── Topbar.jsx           # Role switchboard, new request trigger & notification popover
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
│           ├── WorkflowDetailModal.jsx # Visual stepper progress & audit timeline
│           ├── NewSubmissionModal.jsx  # Proposal dispatch form
│           ├── RubricScoringModal.jsx  # Interactive criteria sliders & letter grade
│           ├── ManualOverrideModal.jsx # Mentor reassignment dialog with justification
│           └── SanctionLetterModal.jsx # University memorandum order with print/PDF
├── server/                      # Express REST API & MongoDB Atlas Backend
│   ├── server.js                # Express application listening on 0.0.0.0:5000
│   ├── config/db.js             # Mongoose connection to MongoDB Atlas
│   ├── models/                  # Workflow, Faculty, ProjectTeam, Notification schemas
│   ├── controllers/             # REST controllers for workflows, allocation & faculty
│   ├── routes/                  # Express routing modules (/api/workflows, /api/allocation, etc.)
│   ├── seed/seedData.js         # Auto-seeding script for fresh Atlas clusters
│   └── Dockerfile               # Production Node 20 Alpine backend container
├── Dockerfile                   # Multi-stage Dockerfile (Node 20 builder -> Nginx Alpine runtime)
├── docker-compose.yml           # Multi-container orchestration (backend + frontend)
├── nginx.conf                   # Hardened Nginx reverse proxy with /healthz and /api routing
├── .github/workflows/ci.yml     # GitHub Actions CI matrix testing (Node 18/20/22) & container tests
└── tests/                       # Unit tests & syntax verification suite
    ├── workflowEngine.test.js   # Unit tests for WorkflowEngine, RBAC & rubrics
    ├── allocationEngine.test.js # Unit tests for Gale-Shapley matching & quota guards
    └── syntax-check.js          # Static asset, React structure & JavaScript syntax validator
```

---

## 6. Execution Options

### Option A: Direct Browser Run (Zero-Dependencies)
Double-click `index.html` or navigate to:
```
file:///d:/Technical/Sem7_IT_Lab/Project7/index.html
```

### Option B: Docker Containerization
The application is fully containerized using an ultra-lightweight `nginx:alpine` image with built-in healthchecks and security headers.

1. **Build Docker Image**:
   ```bash
   docker build -t deptflow360:latest .
   ```
2. **Run Container**:
   ```bash
   docker run -d --name deptflow-app -p 8080:80 deptflow360:latest
   ```
3. **Verify Healthcheck**:
   ```bash
   curl http://localhost:8080/healthz
   # Output: OK
   ```
4. **Access in Browser**:
   Navigate to `http://localhost:8080`

### Option C: Docker Compose
```bash
# Launch with healthcheck
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Teardown
docker compose down
```

---

## 7. Automated Testing & Continuous Integration (CI)

### 7.1 Running Tests Locally
The project includes a dependency-free test suite utilizing Node.js's built-in test runner:

```bash
# Run syntax and static asset integrity checks
npm run test:syntax

# Run all unit tests (WorkflowEngine & AllocationEngine)
npm test

# Run entire CI test suite locally
npm run ci
```

### 7.2 GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)
Every code push and pull request to `main` / `master` automatically triggers a 2-stage CI workflow on GitHub cloud runners:

1. **Job 1: Unit Tests & Code Integrity Matrix (`test-and-lint`)**:
   - Executes across **Node.js 18.x, 20.x, and 22.x**.
   - Validates JavaScript syntax using Node's `vm` compiler.
   - Tests deterministic state transitions, RBAC permissions, audit log history creation, and milestone scoring.
   - Tests Gale-Shapley stable matching, quota constraints, cascading fallbacks, and manual overrides.
2. **Job 2: Docker Build & Live Health Check (`docker-validation`)**:
   - Builds the production Docker image with Docker Buildx.
   - Spins up the container and probes `http://localhost:8080/healthz`.
   - Asserts HTTP 200 status code and checks that response payload contains `DeptFlow 360`.
   - Validates Nginx security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`).
   - Automatically dumps container logs and cleans up.

---

## 8. Key Features & Verification Steps

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

## 9. University Lab Viva Voce Q&A Reference

### Q1: Why use a Workflow-Based Architecture instead of simple CRUD database tables?
**Answer:** Academic activities are non-linear, multi-stakeholder processes with legal and regulatory ramifications. A basic CRUD database allows arbitrary writes and lacks state transition history. A workflow-based architecture enforces **finite deterministic states**, ensures **only authorized actors can trigger specific transitions**, maintains a **tamper-evident audit ledger**, and prevents illegal bypasses (e.g., an unallocated or unverified project cannot be accidentally approved by the HOD).

### Q2: How does the Project Allocation algorithm prevent faculty burnout/overload?
**Answer:** The allocation engine implements strict capacity guards (`ugQuotaMax`, `pgQuotaMax`). During preference-based bidding, if a faculty member's quota is exhausted by higher-merit student teams, the engine systematically cascades lower-ranked teams to their secondary choices rather than exceeding the quota.

### Q3: How is RBAC enforced on the client side?
**Answer:** In `workflowEngine.js`, the method `getAvailableActions()` cross-references `activeRoleKey`, `activeRoleData.id`, and `workflow.state` against defined permission vectors. Actions such as `HOD_APPROVE` are physically stripped from the DOM and blocked in the transition validator if invoked by unauthorized roles.

### Q4: How is the Docker image optimized and secured?
**Answer:** The container utilizes `nginx:alpine` (~23MB total footprint), strips default server configurations, enforces secure file read permissions, enables Gzip compression, injects anti-clickjacking and MIME-type sniffing defense headers (`X-Frame-Options`, `X-Content-Type-Options`), and exposes a dedicated `/healthz` probe for container orchestrators (Kubernetes / Docker Compose).
