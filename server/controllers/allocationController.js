const ProjectTeam = require('../models/ProjectTeam');
const Faculty = require('../models/Faculty');
const { INITIAL_PROJECT_TEAMS, INITIAL_FACULTY } = require('../seed/seedData');

// GET /api/allocation/teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await ProjectTeam.find().sort({ type: 1, avgCgpa: -1 });
    res.json({ success: true, count: teams.length, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/allocation/quotas
exports.getQuotas = async (req, res) => {
  try {
    const faculty = await Faculty.find();
    const teams = await ProjectTeam.find();

    const quotaMap = {};
    faculty.forEach(f => {
      quotaMap[f.id] = {
        ugCurrent: 0,
        pgCurrent: 0,
        ugMax: f.ugQuotaMax,
        pgMax: f.pgQuotaMax
      };
    });

    teams.forEach(t => {
      if (t.allocatedGuideId && quotaMap[t.allocatedGuideId]) {
        if (t.type === 'UG') {
          quotaMap[t.allocatedGuideId].ugCurrent += 1;
        } else if (t.type === 'PG') {
          quotaMap[t.allocatedGuideId].pgCurrent += 1;
        }
      }
    });

    // Update in database
    for (const f of faculty) {
      if (quotaMap[f.id]) {
        await Faculty.updateOne(
          { id: f.id },
          { 
            ugQuotaCurrent: quotaMap[f.id].ugCurrent,
            pgQuotaCurrent: quotaMap[f.id].pgCurrent
          }
        );
      }
    }

    const updatedFaculty = await Faculty.find();
    res.json({ success: true, data: updatedFaculty, quotaMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/allocation/match - Automated Gale-Shapley Matching Simulation
exports.runMatching = async (req, res) => {
  try {
    const logs = [];
    logs.push("Initializing Server-Side Gale-Shapley Project Allocation Engine...");

    const faculty = await Faculty.find();
    const teams = await ProjectTeam.find();

    // Capacity tracking
    const ugCapacity = {};
    const pgCapacity = {};
    faculty.forEach(f => {
      ugCapacity[f.id] = f.ugQuotaMax;
      pgCapacity[f.id] = f.pgQuotaMax;
    });

    const facultyMap = {};
    faculty.forEach(f => { facultyMap[f.id] = f; });

    // Separate UG and PG, sort by merit (CGPA desc)
    const ugTeams = teams.filter(t => t.type === 'UG').sort((a, b) => b.avgCgpa - a.avgCgpa);
    const pgTeams = teams.filter(t => t.type === 'PG').sort((a, b) => b.avgCgpa - a.avgCgpa);

    // 1. Process UG Teams
    for (const team of ugTeams) {
      let allocated = false;
      logs.push(`Evaluating UG Team [${team.teamId}] '${team.leadName}' (Avg CGPA: ${team.avgCgpa.toFixed(2)})`);

      for (let i = 0; i < team.preferences.length; i++) {
        const prefGuideId = team.preferences[i];
        const guideName = facultyMap[prefGuideId]?.name || prefGuideId;

        if (ugCapacity[prefGuideId] > 0) {
          ugCapacity[prefGuideId] -= 1;
          team.allocatedGuideId = prefGuideId;
          team.status = 'ALLOCATED';
          allocated = true;
          logs.push(`  -> Matched to Choice #${i + 1}: ${guideName}. Available capacity: ${ugCapacity[prefGuideId]}`);
          break;
        } else {
          logs.push(`  -> Choice #${i + 1} (${guideName}) quota is FULL. Cascading to next preference...`);
        }
      }

      if (!allocated) {
        const fallbackGuide = faculty.find(f => ugCapacity[f.id] > 0);
        if (fallbackGuide) {
          ugCapacity[fallbackGuide.id] -= 1;
          team.allocatedGuideId = fallbackGuide.id;
          team.status = 'ALLOCATED';
          logs.push(`  -> Preferences exhausted. System assigned to available mentor: ${fallbackGuide.name}`);
        } else {
          team.allocatedGuideId = null;
          team.status = 'UNALLOCATED_OVERFLOW';
          logs.push(`  -> [OVERFLOW] No supervisory quota remaining in department.`);
        }
      }

      await team.save();
    }

    // 2. Process PG Scholars
    for (const scholar of pgTeams) {
      let allocated = false;
      logs.push(`Evaluating PG Scholar [${scholar.teamId}] '${scholar.leadName}' (CGPA: ${scholar.avgCgpa.toFixed(2)})`);

      for (let i = 0; i < scholar.preferences.length; i++) {
        const prefGuideId = scholar.preferences[i];
        const guideName = facultyMap[prefGuideId]?.name || prefGuideId;

        if (pgCapacity[prefGuideId] > 0) {
          pgCapacity[prefGuideId] -= 1;
          scholar.allocatedGuideId = prefGuideId;
          scholar.status = 'ALLOCATED';
          allocated = true;
          logs.push(`  -> PG Match confirmed for Choice #${i + 1}: ${guideName}.`);
          break;
        }
      }

      if (!allocated) {
        const fallbackGuide = faculty.find(f => pgCapacity[f.id] > 0);
        if (fallbackGuide) {
          pgCapacity[fallbackGuide.id] -= 1;
          scholar.allocatedGuideId = fallbackGuide.id;
          scholar.status = 'ALLOCATED';
          logs.push(`  -> System assigned to research guide: ${fallbackGuide.name}`);
        }
      }

      await scholar.save();
    }

    // Recalculate faculty quotas in DB
    for (const f of faculty) {
      const ugCurrent = await ProjectTeam.countDocuments({ allocatedGuideId: f.id, type: 'UG' });
      const pgCurrent = await ProjectTeam.countDocuments({ allocatedGuideId: f.id, type: 'PG' });
      await Faculty.updateOne({ id: f.id }, { ugQuotaCurrent: ugCurrent, pgQuotaCurrent: pgCurrent });
    }

    logs.push("Gale-Shapley allocation simulation completed successfully on MongoDB Atlas!");
    const updatedTeams = await ProjectTeam.find();
    res.json({ success: true, logs, data: updatedTeams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/allocation/override - Manual Guide Override
exports.manualOverride = async (req, res) => {
  try {
    const { teamId, newFacultyId, reason } = req.body;
    const actorName = req.body.actorName || req.body.overrideBy || 'Coordinator';
    const team = await ProjectTeam.findOne({ teamId });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Project team not found.' });
    }

    const previousGuide = team.allocatedGuideId;
    team.allocatedGuideId = newFacultyId;
    team.status = 'MANUALLY_ALLOCATED';
    team.overrideAudit = {
      timestamp: new Date().toLocaleString(),
      by: actorName || 'Coordinator',
      reason: reason || 'Administrative balancing',
      previousGuide
    };

    await team.save();

    // Recalculate quotas for previous and new guide
    if (previousGuide) {
      const prevUg = await ProjectTeam.countDocuments({ allocatedGuideId: previousGuide, type: 'UG' });
      const prevPg = await ProjectTeam.countDocuments({ allocatedGuideId: previousGuide, type: 'PG' });
      await Faculty.updateOne({ id: previousGuide }, { ugQuotaCurrent: prevUg, pgQuotaCurrent: prevPg });
    }

    const newUg = await ProjectTeam.countDocuments({ allocatedGuideId: newFacultyId, type: 'UG' });
    const newPg = await ProjectTeam.countDocuments({ allocatedGuideId: newFacultyId, type: 'PG' });
    await Faculty.updateOne({ id: newFacultyId }, { ugQuotaCurrent: newUg, pgQuotaCurrent: newPg });

    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/allocation/reset
exports.resetAllocations = async (req, res) => {
  try {
    await ProjectTeam.deleteMany({});
    await ProjectTeam.insertMany(INITIAL_PROJECT_TEAMS);

    await Faculty.deleteMany({});
    await Faculty.insertMany(INITIAL_FACULTY);

    const teams = await ProjectTeam.find();
    res.json({ success: true, message: 'Project allocations reset to baseline.', data: teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
