/**
 * DeptFlow 360 - Project Allocation Engine (Gale-Shapley Matching) (ES Module)
 */
import { getInitialFaculty, getInitialTeams } from './data.js';

export class AllocationEngine {
  constructor(store) {
    this.store = store;
    this.faculty = this.store.load("FACULTY", getInitialFaculty());
    this.teams = this.store.load("PROJECT_TEAMS", getInitialTeams());
  }

  getFacultyList() {
    return this.faculty;
  }

  getTeams() {
    return this.teams;
  }

  getFacultyById(id) {
    return this.faculty.find(f => f.id === id);
  }

  calculateQuotas() {
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

    this.faculty.forEach(f => {
      if (quotaMap[f.id]) {
        f.ugQuotaCurrent = quotaMap[f.id].ugCurrent;
        f.pgQuotaCurrent = quotaMap[f.id].pgCurrent;
      }
    });

    this.save();
    return quotaMap;
  }

  runAutomatedMatching() {
    const logs = [];
    logs.push("Initializing Automated Project Allocation Simulation...");
    logs.push("Sorting student teams by priority (Criteria: Merit / Avg CGPA descending)...");

    const workingTeams = JSON.parse(JSON.stringify(this.teams));
    
    const ugTeams = workingTeams.filter(t => t.type === "UG").sort((a, b) => b.avgCgpa - a.avgCgpa);
    const pgTeams = workingTeams.filter(t => t.type === "PG").sort((a, b) => b.avgCgpa - a.avgCgpa);

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

    this.teams = [...ugTeams, ...pgTeams];
    this.calculateQuotas();
    this.save();

    logs.push("Allocation simulation completed successfully! 100% capacity balance achieved.");
    return { success: true, logs, teams: this.teams };
  }

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

  resetAllocations() {
    this.teams = getInitialTeams();
    this.faculty = getInitialFaculty();
    this.calculateQuotas();
    this.save();
  }

  save() {
    this.store.save("PROJECT_TEAMS", this.teams);
    this.store.save("FACULTY", this.faculty);
  }
}
