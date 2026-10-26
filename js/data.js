/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Core Data Models, Initial Seed Fixtures & Persistence Layer
 */

const INITIAL_FACULTY = [
  {
    id: "FAC-01",
    name: "Dr. Rajeshwar Sen",
    role: "HOD",
    designation: "Professor & Head of Department",
    email: "hod.it@university.edu",
    specializations: ["Distributed Systems", "Cloud Computing", "Fault-Tolerant Architectures"],
    ugQuotaMax: 2,
    ugQuotaCurrent: 1,
    pgQuotaMax: 3,
    pgQuotaCurrent: 2,
    avatar: "👨‍💼",
    room: "IT-301 (HOD Chamber)"
  },
  {
    id: "FAC-02",
    name: "Dr. Ananya Roy",
    role: "COORDINATOR",
    designation: "Associate Professor (UG/PG Project Convener)",
    email: "ananya.roy@university.edu",
    specializations: ["Artificial Intelligence", "NLP", "Explainable AI (XAI)"],
    ugQuotaMax: 3,
    ugQuotaCurrent: 2,
    pgQuotaMax: 2,
    pgQuotaCurrent: 1,
    avatar: "👩‍🏫",
    room: "IT-208"
  },
  {
    id: "FAC-03",
    name: "Dr. Vikramaditya Das",
    role: "FACULTY",
    designation: "Associate Professor",
    email: "vikram.das@university.edu",
    specializations: ["Cybersecurity", "Blockchain & Web3", "Network Protocol Security"],
    ugQuotaMax: 3,
    ugQuotaCurrent: 2,
    pgQuotaMax: 2,
    pgQuotaCurrent: 1,
    avatar: "👨‍🏫",
    room: "IT-215"
  },
  {
    id: "FAC-04",
    name: "Dr. Meenakshi Sundaram",
    role: "FACULTY",
    designation: "Assistant Professor",
    email: "m.sundaram@university.edu",
    specializations: ["Computer Vision", "Medical Image Processing", "Edge AI"],
    ugQuotaMax: 3,
    ugQuotaCurrent: 1,
    pgQuotaMax: 1,
    pgQuotaCurrent: 1,
    avatar: "👩‍🔬",
    room: "IT-112"
  },
  {
    id: "FAC-05",
    name: "Dr. Arindam Bhattacharya",
    role: "FACULTY",
    designation: "Assistant Professor",
    email: "a.bhattacharya@university.edu",
    specializations: ["Internet of Things (IoT)", "Embedded Systems", "Cyber-Physical Systems"],
    ugQuotaMax: 3,
    ugQuotaCurrent: 0,
    pgQuotaMax: 1,
    pgQuotaCurrent: 0,
    avatar: "👨‍🔬",
    room: "IT-105"
  }
];

const INITIAL_ROLES = {
  HOD: {
    id: "FAC-01",
    name: "Dr. Rajeshwar Sen",
    roleType: "HOD",
    title: "Head of Department",
    badgeClass: "badge-hod",
    allowedActions: ["APPROVE", "REJECT", "REQUEST_REVISION", "SIGN_OFF", "OVERRIDE_ALLOCATION", "VIEW_AUDIT"]
  },
  COORDINATOR: {
    id: "FAC-02",
    name: "Dr. Ananya Roy",
    roleType: "COORDINATOR",
    title: "Project Coordinator (UG/PG)",
    badgeClass: "badge-coord",
    allowedActions: ["VERIFY", "RUN_ALLOCATION", "SCHEDULE_DEFENSE", "FORWARD_HOD", "REQUEST_REVISION"]
  },
  FACULTY: {
    id: "FAC-03",
    name: "Dr. Vikramaditya Das",
    roleType: "FACULTY",
    title: "Faculty Guide / Reviewer",
    badgeClass: "badge-faculty",
    allowedActions: ["ENDORSE", "GRADE_RUBRIC", "REQUEST_REVISION", "REJECT", "MEETING_LOG"]
  },
  PG_STUDENT: {
    id: "PG-2025-09",
    name: "Sneha Mukherjee",
    roleType: "PG_STUDENT",
    title: "M.Tech Scholar (2nd Year)",
    rollNo: "IT/MTECH/25/09",
    cgpa: 9.35,
    domain: "Distributed Systems & Cloud",
    badgeClass: "badge-pg",
    allowedActions: ["SUBMIT_DISSERTATION", "SUBMIT_RAC", "SUBMIT_LEAVE", "SUBMIT_LAB_REQ"]
  },
  UG_STUDENT: {
    id: "UG-2023-TEAM-04",
    name: "Rahul Verma (Team Lead)",
    roleType: "UG_STUDENT",
    title: "B.Tech Final Year (Team 04)",
    rollNo: "IT/BTECH/23/041",
    teamMembers: [
      { name: "Rahul Verma", rollNo: "IT/BTECH/23/041", cgpa: 8.84 },
      { name: "Priya Sharma", rollNo: "IT/BTECH/23/048", cgpa: 9.02 },
      { name: "Aditya Nair", rollNo: "IT/BTECH/23/053", cgpa: 8.45 }
    ],
    domain: "Cybersecurity & Blockchain",
    badgeClass: "badge-ug",
    allowedActions: ["SUBMIT_CAPSTONE", "BID_GUIDE", "SUBMIT_MILESTONE", "SUBMIT_NOC"]
  }
};

const INITIAL_PROJECT_TEAMS = [
  {
    teamId: "UG-TEAM-01",
    type: "UG",
    leadName: "Karan Singhania",
    members: ["Karan Singhania (012)", "Ritika Sen (019)", "Dev Patel (024)"],
    avgCgpa: 9.15,
    domain: "Artificial Intelligence",
    title: "Autonomous Multi-Agent Drone Navigation in GPS-Denied Environments",
    preferences: ["FAC-02", "FAC-04", "FAC-05"],
    allocatedGuideId: "FAC-02",
    status: "ALLOCATED",
    workflowId: "WF-2026-UG-01"
  },
  {
    teamId: "UG-TEAM-02",
    type: "UG",
    leadName: "Tanvi Deshmukh",
    members: ["Tanvi Deshmukh (031)", "Siddharth Jain (037)"],
    avgCgpa: 8.92,
    domain: "Distributed Systems",
    title: "Zero-Knowledge Proof Based Decentralized Identity for Academic Credentials",
    preferences: ["FAC-03", "FAC-01", "FAC-02"],
    allocatedGuideId: "FAC-03",
    status: "ALLOCATED",
    workflowId: "WF-2026-UG-02"
  },
  {
    teamId: "UG-TEAM-03",
    type: "UG",
    leadName: "Aman Gupta",
    members: ["Aman Gupta (008)", "Sanya Mirza (014)", "Varun Rao (022)"],
    avgCgpa: 8.75,
    domain: "Computer Vision",
    title: "Real-time Retinal Micro-aneurysm Segmentation using Attention U-Net",
    preferences: ["FAC-04", "FAC-02", "FAC-05"],
    allocatedGuideId: "FAC-04",
    status: "ALLOCATED",
    workflowId: "WF-2026-UG-03"
  },
  {
    teamId: "UG-TEAM-04",
    type: "UG",
    leadName: "Rahul Verma",
    members: ["Rahul Verma (041)", "Priya Sharma (048)", "Aditya Nair (053)"],
    avgCgpa: 8.77,
    domain: "Cybersecurity & Blockchain",
    title: "Post-Quantum Cryptographic Key Encapsulation in Edge IoT Gateways",
    preferences: ["FAC-03", "FAC-01", "FAC-05"],
    allocatedGuideId: "FAC-03",
    status: "PENDING_HOD_CLEARANCE",
    workflowId: "WF-2026-UG-04"
  },
  {
    teamId: "UG-TEAM-05",
    type: "UG",
    leadName: "Neha Kulkarni",
    members: ["Neha Kulkarni (061)", "Zeeshan Ali (067)"],
    avgCgpa: 8.60,
    domain: "Cloud & Distributed Systems",
    title: "Adaptive Serverless Load Balancer with Reinforcement Learning",
    preferences: ["FAC-01", "FAC-02", "FAC-03"],
    allocatedGuideId: null,
    status: "UNALLOCATED",
    workflowId: null
  },
  {
    teamId: "UG-TEAM-06",
    type: "UG",
    leadName: "Deepak Choudhury",
    members: ["Deepak Choudhury (072)", "Bhavna Pillai (079)", "Gaurav Roy (084)"],
    avgCgpa: 8.42,
    domain: "IoT & Embedded",
    title: "Low-Power LoRaWAN Mesh Network for Smart Agriculture Monitoring",
    preferences: ["FAC-05", "FAC-04", "FAC-01"],
    allocatedGuideId: null,
    status: "UNALLOCATED",
    workflowId: null
  },
  {
    teamId: "PG-SCHOLAR-01",
    type: "PG",
    leadName: "Sneha Mukherjee",
    members: ["Sneha Mukherjee (IT/MTECH/25/09)"],
    avgCgpa: 9.35,
    domain: "Distributed Systems & Cloud",
    title: "Byzantine Fault Tolerant Consensus for Geo-Distributed Ledger Shards",
    preferences: ["FAC-01", "FAC-03", "FAC-02"],
    allocatedGuideId: "FAC-01",
    status: "ALLOCATED",
    workflowId: "WF-2026-PG-01"
  },
  {
    teamId: "PG-SCHOLAR-02",
    type: "PG",
    leadName: "Arjun Nair",
    members: ["Arjun Nair (IT/MTECH/25/03)"],
    avgCgpa: 9.10,
    domain: "Artificial Intelligence",
    title: "Parameter-Efficient Fine-Tuning of Small Language Models for Clinical Triaging",
    preferences: ["FAC-02", "FAC-04", "FAC-01"],
    allocatedGuideId: "FAC-02",
    status: "ALLOCATED",
    workflowId: "WF-2026-PG-02"
  }
];

const INITIAL_WORKFLOWS = [
  {
    id: "WF-2026-UG-04",
    type: "UG_PROJECT",
    title: "Post-Quantum Cryptographic Key Encapsulation in Edge IoT Gateways",
    category: "UG",
    submittedBy: {
      id: "UG-2023-TEAM-04",
      name: "Rahul Verma (Team 04)",
      rollNo: "IT/BTECH/23/041",
      email: "rahul.verma@student.university.edu",
      degree: "B.Tech IT (Sem 7)",
      teamMembers: ["Rahul Verma (041)", "Priya Sharma (048)", "Aditya Nair (053)"]
    },
    details: {
      domain: "Cybersecurity & Blockchain",
      abstract: "Implementation of Kyber-512 lattice-based key encapsulation algorithm on ARM Cortex-M microcontrollers to benchmark energy consumption and resistance to side-channel timing analysis.",
      proposedGuideId: "FAC-03",
      guideName: "Dr. Vikramaditya Das",
      allocatedGuideId: "FAC-03",
      budgetEstimated: "₹18,500 (Hardware evaluation boards)",
      referencesCount: 6
    },
    state: "UNDER_HOD_REVIEW",
    slaDaysRemaining: 2,
    history: [
      {
        timestamp: "2026-10-22 10:15 AM",
        actorId: "UG-2023-TEAM-04",
        actorName: "Rahul Verma",
        actorRole: "UG Student",
        action: "PROPOSAL_SUBMITTED",
        comment: "Submitted initial capstone project proposal with Guide choice #1: Dr. Vikramaditya Das.",
        statusFrom: "DRAFT",
        statusTo: "UNDER_GUIDE_REVIEW"
      },
      {
        timestamp: "2026-10-23 03:40 PM",
        actorId: "FAC-03",
        actorName: "Dr. Vikramaditya Das",
        actorRole: "Faculty Guide",
        action: "GUIDE_ENDORSED",
        comment: "Strong theoretical foundation. Lattice parameter selection is feasible. Endorsed for coordinator quota clearance.",
        statusFrom: "UNDER_GUIDE_REVIEW",
        statusTo: "UNDER_COORDINATOR_REVIEW"
      },
      {
        timestamp: "2026-10-25 11:30 AM",
        actorId: "FAC-02",
        actorName: "Dr. Ananya Roy",
        actorRole: "Project Coordinator",
        action: "COORDINATOR_VERIFIED",
        comment: "Quota checked. Dr. Das has 1 slot available. Proposal vetted against curriculum rubric. Forwarding to HOD for final allotment sanction.",
        statusFrom: "UNDER_COORDINATOR_REVIEW",
        statusTo: "UNDER_HOD_REVIEW"
      }
    ],
    milestones: [
      {
        id: "M1",
        name: "Milestone 1: Literature Survey & SRS",
        deadline: "2026-11-15",
        weightage: 20,
        maxScore: 100,
        score: null,
        status: "PENDING",
        submissionUrl: null,
        rubricScores: {}
      },
      {
        id: "M2",
        name: "Milestone 2: Design & Mathematical Formulation",
        deadline: "2026-12-10",
        weightage: 30,
        maxScore: 100,
        score: null,
        status: "PENDING",
        submissionUrl: null,
        rubricScores: {}
      },
      {
        id: "M3",
        name: "Milestone 3: Final Implementation, Code & Defense",
        deadline: "2027-01-20",
        weightage: 50,
        maxScore: 100,
        score: null,
        status: "PENDING",
        submissionUrl: null,
        rubricScores: {}
      }
    ]
  },
  {
    id: "WF-2026-PG-01",
    type: "PG_DISSERTATION",
    title: "Byzantine Fault Tolerant Consensus for Geo-Distributed Ledger Shards",
    category: "PG",
    submittedBy: {
      id: "PG-2025-09",
      name: "Sneha Mukherjee",
      rollNo: "IT/MTECH/25/09",
      email: "sneha.m@pg.university.edu",
      degree: "M.Tech IT (Sem 3)",
      teamMembers: ["Sneha Mukherjee"]
    },
    details: {
      domain: "Distributed Systems & Cloud",
      abstract: "A novel asynchronous BFT protocol reducing commit round latency from 3-phases to 2-phases in WAN setups under partial synchrony assumptions, with formal TLA+ verification.",
      proposedGuideId: "FAC-01",
      guideName: "Dr. Rajeshwar Sen",
      allocatedGuideId: "FAC-01",
      racPanel: ["Dr. Rajeshwar Sen (Chair)", "Dr. Ananya Roy (Member)", "Prof. External (IIT Kharagpur)"],
      scopusTarget: "IEEE Transactions on Parallel & Distributed Systems"
    },
    state: "APPROVED",
    slaDaysRemaining: 14,
    history: [
      {
        timestamp: "2026-09-10 09:30 AM",
        actorId: "PG-2025-09",
        actorName: "Sneha Mukherjee",
        actorRole: "PG Scholar",
        action: "DISSERTATION_PROPOSAL",
        comment: "Submitted M.Tech Dissertation Synopsis along with formal literature survey.",
        statusFrom: "DRAFT",
        statusTo: "UNDER_GUIDE_REVIEW"
      },
      {
        timestamp: "2026-09-12 04:00 PM",
        actorId: "FAC-01",
        actorName: "Dr. Rajeshwar Sen",
        actorRole: "Faculty Guide / HOD",
        action: "GUIDE_ENDORSED",
        comment: "Excellent research formulation. TLA+ specification framework approved.",
        statusFrom: "UNDER_GUIDE_REVIEW",
        statusTo: "UNDER_COORDINATOR_REVIEW"
      },
      {
        timestamp: "2026-09-14 02:15 PM",
        actorId: "FAC-02",
        actorName: "Dr. Ananya Roy",
        actorRole: "Project Coordinator",
        action: "COORDINATOR_VERIFIED",
        comment: "RAC Panel constituted. Quota validated. Forwarded for HOD official sanction.",
        statusFrom: "UNDER_COORDINATOR_REVIEW",
        statusTo: "UNDER_HOD_REVIEW"
      },
      {
        timestamp: "2026-09-15 11:00 AM",
        actorId: "FAC-01",
        actorName: "Dr. Rajeshwar Sen",
        actorRole: "HOD",
        action: "HOD_APPROVED",
        comment: "Formally approved. RAC Review Cycle 1 scheduled for November 2026.",
        statusFrom: "UNDER_HOD_REVIEW",
        statusTo: "APPROVED"
      }
    ],
    milestones: [
      {
        id: "M1",
        name: "RAC Review 1: Problem Formulation & TLA+ Specification",
        deadline: "2026-11-05",
        weightage: 25,
        maxScore: 100,
        score: 94,
        status: "EVALUATED",
        submissionUrl: "https://drive.internal/pg-dissertation-rac1.pdf",
        rubricScores: {
          literatureSurvey: 28,
          rigorAndMath: 38,
          oralDefense: 28
        }
      },
      {
        id: "M2",
        name: "RAC Review 2: Prototype Benchmarking & WAN Testbed",
        deadline: "2026-12-20",
        weightage: 35,
        maxScore: 100,
        score: null,
        status: "SUBMITTED",
        submissionUrl: "https://drive.internal/pg-dissertation-rac2-draft.pdf",
        rubricScores: {}
      },
      {
        id: "M3",
        name: "Final Thesis Submission & Viva Voce",
        deadline: "2027-02-15",
        weightage: 40,
        maxScore: 100,
        score: null,
        status: "PENDING",
        submissionUrl: null,
        rubricScores: {}
      }
    ]
  },
  {
    id: "WF-2026-REQ-08",
    type: "LAB_EQUIPMENT",
    title: "Requisition for NVIDIA Jetson AGX Orin for Edge Deep Learning Lab",
    category: "DEPARTMENTAL",
    submittedBy: {
      id: "FAC-04",
      name: "Dr. Meenakshi Sundaram",
      rollNo: "FAC-04",
      email: "m.sundaram@university.edu",
      degree: "Faculty / Research In-Charge"
    },
    details: {
      purpose: "Procurement of 2x Jetson Orin 64GB Developer Kits for UG/PG medical imaging capstone projects.",
      estimatedCost: "₹2,10,000",
      vendor: "Arrow Electronics India",
      budgetHead: "DST-SERB Grant / Dept Lab Upgradation Fund"
    },
    state: "UNDER_HOD_REVIEW",
    slaDaysRemaining: 1,
    history: [
      {
        timestamp: "2026-10-24 02:00 PM",
        actorId: "FAC-04",
        actorName: "Dr. Meenakshi Sundaram",
        actorRole: "Faculty",
        action: "REQUISITION_RAISED",
        comment: "High computational load in medical imaging projects necessitates edge GPU hardware.",
        statusFrom: "DRAFT",
        statusTo: "UNDER_COORDINATOR_REVIEW"
      },
      {
        timestamp: "2026-10-25 04:15 PM",
        actorId: "FAC-02",
        actorName: "Dr. Ananya Roy",
        actorRole: "Project Coordinator",
        action: "COORDINATOR_VERIFIED",
        comment: "Lab space IT-Lab-4 allocated. Verified against departmental equipment inventory. Recommended for sanction.",
        statusFrom: "UNDER_COORDINATOR_REVIEW",
        statusTo: "UNDER_HOD_REVIEW"
      }
    ]
  },
  {
    id: "WF-2026-NOC-12",
    type: "LEAVE_NOC",
    title: "NOC Application for 6-Month Industry Research Internship at Intel Labs",
    category: "PG",
    submittedBy: {
      id: "PG-2025-09",
      name: "Sneha Mukherjee",
      rollNo: "IT/MTECH/25/09",
      email: "sneha.m@pg.university.edu",
      degree: "M.Tech IT (Sem 3)"
    },
    details: {
      company: "Intel Labs Bangalore",
      stipend: "₹65,000 / month",
      duration: "Dec 1, 2026 to May 31, 2027",
      relationToThesis: "Direct synergy with TLA+ distributed validation framework",
      guideRecommendation: "Endorsed with condition of weekly remote RAC syncs."
    },
    state: "UNDER_GUIDE_REVIEW",
    slaDaysRemaining: 4,
    history: [
      {
        timestamp: "2026-10-26 11:20 AM",
        actorId: "PG-2025-09",
        actorName: "Sneha Mukherjee",
        actorRole: "PG Scholar",
        action: "NOC_REQUESTED",
        comment: "Offer letter attached. Thesis work will be concurrently aligned.",
        statusFrom: "DRAFT",
        statusTo: "UNDER_GUIDE_REVIEW"
      }
    ]
  },
  {
    id: "WF-2026-UG-01",
    type: "UG_PROJECT",
    title: "Autonomous Multi-Agent Drone Navigation in GPS-Denied Environments",
    category: "UG",
    submittedBy: {
      id: "UG-TEAM-01",
      name: "Karan Singhania (Team 01)",
      rollNo: "IT/BTECH/23/012",
      email: "karan.s@student.university.edu",
      degree: "B.Tech IT (Sem 7)",
      teamMembers: ["Karan Singhania (012)", "Ritika Sen (019)", "Dev Patel (024)"]
    },
    details: {
      domain: "Artificial Intelligence",
      abstract: "Visual SLAM integrated with decentralized graph neural networks for drone swarms.",
      proposedGuideId: "FAC-02",
      allocatedGuideId: "FAC-02"
    },
    state: "APPROVED",
    slaDaysRemaining: 21,
    history: [
      {
        timestamp: "2026-09-01 10:00 AM",
        actorId: "UG-TEAM-01",
        actorName: "Karan Singhania",
        actorRole: "UG Student",
        action: "PROPOSAL_SUBMITTED",
        comment: "Initial proposal submitted.",
        statusFrom: "DRAFT",
        statusTo: "UNDER_GUIDE_REVIEW"
      },
      {
        timestamp: "2026-09-03 03:00 PM",
        actorId: "FAC-02",
        actorName: "Dr. Ananya Roy",
        actorRole: "Faculty Guide",
        action: "GUIDE_ENDORSED",
        comment: "Excellent idea. Approved.",
        statusFrom: "UNDER_GUIDE_REVIEW",
        statusTo: "UNDER_COORDINATOR_REVIEW"
      },
      {
        timestamp: "2026-09-05 11:00 AM",
        actorId: "FAC-01",
        actorName: "Dr. Rajeshwar Sen",
        actorRole: "HOD",
        action: "HOD_APPROVED",
        comment: "Sanctioned. Lab access granted.",
        statusFrom: "UNDER_COORDINATOR_REVIEW",
        statusTo: "APPROVED"
      }
    ],
    milestones: [
      {
        id: "M1",
        name: "Milestone 1: Literature Survey & System Architecture",
        deadline: "2026-10-15",
        weightage: 20,
        maxScore: 100,
        score: 91,
        status: "EVALUATED",
        submissionUrl: "https://drive.internal/ug-team1-m1.pdf",
        rubricScores: { literatureSurvey: 27, rigorAndMath: 36, oralDefense: 28 }
      },
      {
        id: "M2",
        name: "Milestone 2: Simulation Benchmark & ROS Integration",
        deadline: "2026-11-25",
        weightage: 30,
        maxScore: 100,
        score: null,
        status: "PENDING",
        submissionUrl: null,
        rubricScores: {}
      }
    ]
  }
];

const EVALUATION_RUBRICS = [
  {
    key: "literatureSurvey",
    label: "Literature Review & Problem Formulation",
    max: 30,
    criteria: [
      "Depth of state-of-the-art citation (IEEE/ACM/Scopus indexed)",
      "Clear articulation of problem statement & research gap",
      "Benchmark metrics identified"
    ]
  },
  {
    key: "rigorAndMath",
    label: "Technical Rigor, Architecture & Methodology",
    max: 40,
    criteria: [
      "Soundness of mathematical formulations or system architecture",
      "Modular software engineering principles & testability",
      "Feasibility within timeline and computational constraints"
    ]
  },
  {
    key: "oralDefense",
    label: "Viva Voce, Q&A & Demonstration",
    max: 30,
    criteria: [
      "Clarity of technical defense under cross-examination",
      "Individual contribution clarity across all team members",
      "Working prototype / simulation demonstration"
    ]
  }
];

// LocalStorage Helper with fallback
class DeptStore {
  static PREFIX = "DAWMS_DEPT_PORTAL_";

  static load(key, defaultVal) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.warn("Storage read failed, returning defaults", e);
      return defaultVal;
    }
  }

  static save(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage write failed", e);
    }
  }

  static reset() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(this.PREFIX)) localStorage.removeItem(k);
      });
    } catch (e) {
      console.error("Storage reset failed", e);
    }
  }
}
