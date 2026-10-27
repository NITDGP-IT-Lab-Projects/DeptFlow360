/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Clean Core Data Schema & Storage Engine (Zero Sample Data Baseline)
 */

const INITIAL_FACULTY = [];

const INITIAL_ROLES = {
  HOD: {
    id: "ROLE-HOD",
    name: "Head of Department",
    roleType: "HOD",
    title: "Head of Department (Executive Authority)",
    badgeClass: "badge-hod",
    allowedActions: ["APPROVE", "REJECT", "REQUEST_REVISION", "SIGN_OFF", "OVERRIDE_ALLOCATION", "VIEW_AUDIT"]
  },
  COORDINATOR: {
    id: "ROLE-COORDINATOR",
    name: "Project Coordinator",
    roleType: "COORDINATOR",
    title: "Project Coordinator (UG/PG Project Convener)",
    badgeClass: "badge-coord",
    allowedActions: ["VERIFY", "RUN_ALLOCATION", "SCHEDULE_DEFENSE", "FORWARD_HOD", "REQUEST_REVISION"]
  },
  FACULTY: {
    id: "ROLE-FACULTY",
    name: "Faculty Guide",
    roleType: "FACULTY",
    title: "Faculty Supervisor / Reviewer",
    badgeClass: "badge-faculty",
    allowedActions: ["ENDORSE", "GRADE_RUBRIC", "REQUEST_REVISION", "REJECT", "MEETING_LOG"]
  },
  PG_STUDENT: {
    id: "ROLE-PG-STUDENT",
    name: "PG Scholar",
    roleType: "PG_STUDENT",
    title: "M.Tech Dissertation Scholar",
    badgeClass: "badge-pg",
    allowedActions: ["SUBMIT_DISSERTATION", "SUBMIT_RAC", "SUBMIT_LEAVE", "SUBMIT_LAB_REQ"]
  },
  UG_STUDENT: {
    id: "ROLE-UG-STUDENT",
    name: "UG Capstone Scholar",
    roleType: "UG_STUDENT",
    title: "B.Tech Final Year Scholar",
    badgeClass: "badge-ug",
    allowedActions: ["SUBMIT_CAPSTONE", "BID_GUIDE", "SUBMIT_MILESTONE", "SUBMIT_NOC"]
  }
};

const INITIAL_PROJECT_TEAMS = [];

const INITIAL_WORKFLOWS = [];

const INITIAL_NOTIFICATIONS = [];

const DEFAULT_AUTH_USERS = [];

const EVALUATION_RUBRICS = [
  {
    id: "CRIT-01",
    label: "Literature Survey & Problem Formulation",
    max: 30,
    criteria: [
      "Comprehensiveness of state-of-the-art literature review",
      "Clarity in identifying research gaps and engineering challenges",
      "Quality of preliminary formulation and theoretical basis"
    ]
  },
  {
    id: "CRIT-02",
    label: "Methodology, Technical Rigor & Architecture",
    max: 40,
    criteria: [
      "Mathematical rigor, algorithm design, or system architecture",
      "Appropriateness of simulation / experimental testbed setup",
      "Reproducibility, modular software architecture & adherence to standards"
    ]
  },
  {
    id: "CRIT-03",
    label: "Viva Voce, Q&A & Demonstration",
    max: 30,
    criteria: [
      "Clarity of technical defense under cross-examination",
      "Individual contribution clarity across all team members",
      "Working prototype / simulation demonstration"
    ]
  }
];

const RUBRIC_CRITERIA = EVALUATION_RUBRICS;

const getInitialFaculty = () => [];
const getInitialTeams = () => [];
const getInitialWorkflows = () => [];

class DeptStore {
  static PREFIX = "DAWMS_DEPT_PORTAL_";
  static _memoryStore = {};

  static load(key, defaultVal = []) {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(this.PREFIX + key);
        return data ? JSON.parse(data) : (defaultVal ? JSON.parse(JSON.stringify(defaultVal)) : []);
      }
      const memData = this._memoryStore[this.PREFIX + key];
      return memData !== undefined ? JSON.parse(memData) : (defaultVal ? JSON.parse(JSON.stringify(defaultVal)) : []);
    } catch (e) {
      console.warn("Storage read failed, returning defaults", e);
      return defaultVal ? JSON.parse(JSON.stringify(defaultVal)) : [];
    }
  }

  static get(key, defaultVal = []) {
    return this.load(key, defaultVal);
  }

  static set(key, value) {
    return this.save(key, value);
  }

  static clear() {
    return this.reset();
  }

  static save(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this.PREFIX + key, serialized);
      } else {
        this._memoryStore[this.PREFIX + key] = serialized;
      }
    } catch (e) {
      console.error("Storage write failed", e);
    }
  }

  static reset() {
    try {
      if (typeof localStorage !== "undefined") {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(this.PREFIX)) localStorage.removeItem(k);
        });
      }
      this._memoryStore = {};
    } catch (e) {
      console.error("Storage reset failed", e);
    }
  }
}

// Node.js CommonJS Module Export for Unit Testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    INITIAL_FACULTY,
    INITIAL_ROLES,
    INITIAL_PROJECT_TEAMS,
    INITIAL_WORKFLOWS,
    INITIAL_NOTIFICATIONS,
    DEFAULT_AUTH_USERS,
    EVALUATION_RUBRICS,
    RUBRIC_CRITERIA,
    getInitialFaculty,
    getInitialTeams,
    getInitialWorkflows,
    DeptStore
  };
}
