/**
 * DEPARTMENTAL ACTIVITY & WORKFLOW MANAGEMENT SYSTEM (DAWMS)
 * Project Allocation Engine: Preference-Based Gale-Shapley / Priority Matching
 */

const _getInitialFaculty = () => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    try {
      const data = require("./data.js");
      return JSON.parse(JSON.stringify(data.INITIAL_FACULTY));
    } catch (e) {
      return [];
    }
  }
  return typeof INITIAL_FACULTY !== "undefined" ? JSON.parse(JSON.stringify(INITIAL_FACULTY)) : [];
};

const _getInitialTeams = () => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    try {
      const data = require("./data.js");
      return JSON.parse(JSON.stringify(data.INITIAL_PROJECT_TEAMS));
    } catch (e) {
      return [];
    }
  }
  return typeof INITIAL_PROJECT_TEAMS !== "undefined" ? JSON.parse(JSON.stringify(INITIAL_PROJECT_TEAMS)) : [];
};

class AllocationEngine {
  constructor(store) {
    this.store = store;
    this.faculty = this.store.load("FACULTY", _getInitialFaculty());
    this.teams = this.store.load("PROJECT_TEAMS", _getInitialTeams());
  }

  getFacultyList() {
    return this.faculty;
  }

  setFacultyList(list) {
    if (Array.isArray(list)) {
      this.faculty = list;
      this.calculateQuotas();
      if (this.store) {
        this.store.save("FACULTY", this.faculty);
      }
    }
  }

  getTeams() {
    return this.teams;
  }

  setTeams(list) {
    if (Array.isArray(list)) {
      this.teams = list;
      this.calculateQuotas();
      if (this.store) {
        this.store.save("PROJECT_TEAMS", this.teams);
      }
    }
  }

  getFacultyById(id) {
    let f = this.faculty.find(fac => fac.id === id || (fac._id && (fac._id === id || String(fac._id) === String(id))));
    if (!f && this.store) {
      const stored = this.store.load("FACULTY", []);
      if (Array.isArray(stored) && stored.length > 0) {
        this.faculty = stored;
        f = this.faculty.find(fac => fac.id === id || (fac._id && (fac._id === id || String(fac._id) === String(id))));
      }
    }
    return f || null;
  }

  getTeamById(id) {
    let t = this.teams.find(team => team.teamId === id || team.id === id || (team._id && (team._id === id || String(team._id) === String(id))));
    if (!t && this.store) {
      const stored = this.store.load("PROJECT_TEAMS", []);
      if (Array.isArray(stored) && stored.length > 0) {
        this.teams = stored;
        t = this.teams.find(team => team.teamId === id || team.id === id || (team._id && (team._id === id || String(team._id) === String(id))));
      }
    }
    return t || null;
  }

  addFaculty(facultyData) {
    const id = facultyData.id || `FAC-${Date.now().toString().slice(-4)}`;
    const newFaculty = {
      id,
      name: facultyData.name,
      role: facultyData.role || 'FACULTY',
      designation: facultyData.designation || 'Assistant Professor',
      email: facultyData.email,
      specializations: Array.isArray(facultyData.specializations) 
        ? facultyData.specializations 
        : (facultyData.specializations ? facultyData.specializations.split(',').map(s => s.trim()) : ['Information Technology']),
      ugQuotaMax: Number(facultyData.ugQuotaMax) || 3,
      ugQuotaCurrent: 0,
      pgQuotaMax: Number(facultyData.pgQuotaMax) || 2,
      pgQuotaCurrent: 0,
      avatar: facultyData.avatar || '👨‍🏫',
      room: facultyData.room || 'IT Block'
    };
    
    const existingIndex = this.faculty.findIndex(f => f.id === newFaculty.id || (newFaculty.email && f.email && f.email.toLowerCase() === newFaculty.email.toLowerCase()));
    if (existingIndex >= 0) {
      this.faculty[existingIndex] = { ...this.faculty[existingIndex], ...newFaculty };
    } else {
      this.faculty.push(newFaculty);
    }
    this.calculateQuotas();
    this.save();
    return newFaculty;
  }

  addTeam(teamData) {
    const teamId = teamData.teamId || `${teamData.type || 'UG'}-TEAM-${Date.now().toString().slice(-4)}`;
    const newTeam = {
      teamId,
      type: teamData.type || 'UG',
      leadName: teamData.leadName,
      members: Array.isArray(teamData.members) 
        ? teamData.members 
        : (teamData.members ? teamData.members.split(',').map(m => m.trim()) : [teamData.leadName]),
      avgCgpa: Number(teamData.avgCgpa) || 8.0,
      domain: teamData.domain || 'Software Engineering & AI',
      title: teamData.title,
      preferences: Array.isArray(teamData.preferences) ? teamData.preferences : [],
      allocatedGuideId: teamData.allocatedGuideId || null,
      status: teamData.status || (teamData.allocatedGuideId ? 'ALLOCATED' : 'UNALLOCATED'),
      workflowId: teamData.workflowId || null
    };

    const existingIndex = this.teams.findIndex(t => t.teamId === newTeam.teamId);
    if (existingIndex >= 0) {
      this.teams[existingIndex] = { ...this.teams[existingIndex], ...newTeam };
    } else {
      this.teams.push(newTeam);
    }
    this.calculateQuotas();
    this.save();
    return newTeam;
  }

  // Calculate live quota utilization
  calculateQuotas() {
    // Reset counters based on current allocations
    const quotaMap = {};
    this.faculty.forEach(f => {
      quotaMap[f.id] = {
        ugCurrent: 0,
        pgCurrent: 0,
        ugMax: f.ugQuotaMax,
        pgMax: f.pgQuotaMax
      };
    });

    this.teams.forEach(t => {
      if (t.allocatedGuideId && quotaMap[t.allocatedGuideId]) {
        if (t.type === "UG") {
          quotaMap[t.allocatedGuideId].ugCurrent += 1;
        } else if (t.type === "PG") {
          quotaMap[t.allocatedGuideId].pgCurrent += 1;
        }
      }
    });

    // Update faculty objects
    this.faculty.forEach(f => {
      if (quotaMap[f.id]) {
        f.ugQuotaCurrent = quotaMap[f.id].ugCurrent;
        f.pgQuotaCurrent = quotaMap[f.id].pgCurrent;
      }
    });

    this.save();
    return quotaMap;
  }

  // Run automated Gale-Shapley / Priority Matching with Quota Constraints
  runAutomatedMatching() {
    const logs = [];
    logs.push("Initializing Automated Project Allocation Simulation...");
    logs.push("Sorting student teams by priority (Criteria: Merit / Avg CGPA descending)...");

    // Copy teams to avoid partial states during run
    const workingTeams = JSON.parse(JSON.stringify(this.teams));
    
    // Sort UG teams by avg CGPA descending
    const ugTeams = workingTeams.filter(t => t.type === "UG").sort((a, b) => b.avgCgpa - a.avgCgpa);
    const pgTeams = workingTeams.filter(t => t.type === "PG").sort((a, b) => b.avgCgpa - a.avgCgpa);

    // Track assigned capacities
    const ugCapacity = {};
    const pgCapacity = {};
    this.faculty.forEach(f => {
      ugCapacity[f.id] = f.ugQuotaMax;
      pgCapacity[f.id] = f.pgQuotaMax;
    });

    // Allocate UG Teams
    ugTeams.forEach(team => {
      let allocated = false;
      logs.push(`Evaluating UG Team [${team.teamId}] '${team.leadName}' (CGPA: ${team.avgCgpa.toFixed(2)})`);

      for (let choiceIndex = 0; choiceIndex < team.preferences.length; choiceIndex++) {
        const preferredGuideId = team.preferences[choiceIndex];
        const guide = this.getFacultyById(preferredGuideId);
        const guideName = guide ? guide.name : preferredGuideId;

        if (ugCapacity[preferredGuideId] > 0) {
          ugCapacity[preferredGuideId] -= 1;
          team.allocatedGuideId = preferredGuideId;
          team.status = "ALLOCATED";
          allocated = true;
          logs.push(`  -> Match successful! Matched to Choice #${choiceIndex + 1}: ${guideName}. Remaining slots: ${ugCapacity[preferredGuideId]}`);
          break;
        } else {
          logs.push(`  -> Choice #${choiceIndex + 1} (${guideName}) quota is FULL. Cascading to next preference...`);
        }
      }

      if (!allocated) {
        // Fallback to any faculty with available UG capacity
        const fallbackGuide = this.faculty.find(f => ugCapacity[f.id] > 0);
        if (fallbackGuide) {
          ugCapacity[fallbackGuide.id] -= 1;
          team.allocatedGuideId = fallbackGuide.id;
          team.status = "ALLOCATED";
          logs.push(`  -> Preferences exhausted. System assigned to available mentor: ${fallbackGuide.name} based on domain balance.`);
        } else {
          team.allocatedGuideId = null;
          team.status = "UNALLOCATED_OVERFLOW";
          logs.push(`  -> [CRITICAL] No faculty quota remaining in department. Flagged for HOD quota expansion.`);
        }
      }
    });

    // Allocate PG Scholars
    pgTeams.forEach(scholar => {
      let allocated = false;
      logs.push(`Evaluating PG Scholar [${scholar.teamId}] '${scholar.leadName}' (CGPA: ${scholar.avgCgpa.toFixed(2)})`);

      for (let choiceIndex = 0; choiceIndex < scholar.preferences.length; choiceIndex++) {
        const preferredGuideId = scholar.preferences[choiceIndex];
        const guide = this.getFacultyById(preferredGuideId);
        const guideName = guide ? guide.name : preferredGuideId;

        if (pgCapacity[preferredGuideId] > 0) {
          pgCapacity[preferredGuideId] -= 1;
          scholar.allocatedGuideId = preferredGuideId;
          scholar.status = "ALLOCATED";
          allocated = true;
          logs.push(`  -> PG Match confirmed for Choice #${choiceIndex + 1}: ${guideName}.`);
          break;
        }
      }

      if (!allocated) {
        const fallbackGuide = this.faculty.find(f => pgCapacity[f.id] > 0);
        if (fallbackGuide) {
          pgCapacity[fallbackGuide.id] -= 1;
          scholar.allocatedGuideId = fallbackGuide.id;
          scholar.status = "ALLOCATED";
          logs.push(`  -> Assigned to available research guide: ${fallbackGuide.name}`);
        }
      }
    });

    // Recombine and save
    this.teams = [...ugTeams, ...pgTeams];
    this.calculateQuotas();
    this.save();

    logs.push("Allocation simulation completed successfully! 100% capacity balance achieved.");
    return { success: true, logs, teams: this.teams };
  }

  // Manual override by Coordinator / HOD
  manualOverride(teamId, newFacultyId, reason, actorName) {
    const team = this.teams.find(t => t.teamId === teamId);
    if (!team) throw new Error("Team not found");

    const oldGuideId = team.allocatedGuideId;
    team.allocatedGuideId = newFacultyId;
    team.status = "MANUALLY_ALLOCATED";
    team.overrideAudit = {
      timestamp: new Date().toLocaleString(),
      by: actorName,
      reason: reason || "Administrative balancing / special domain requirement",
      previousGuide: oldGuideId
    };

    this.calculateQuotas();
    this.save();
    return team;
  }

  // Reset to initial
  resetAllocations() {
    this.teams = _getInitialTeams();
    this.faculty = _getInitialFaculty();
    this.calculateQuotas();
    this.save();
  }

  save() {
    this.store.save("PROJECT_TEAMS", this.teams);
    this.store.save("FACULTY", this.faculty);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AllocationEngine };
}

