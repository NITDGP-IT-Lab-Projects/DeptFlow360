/**
 * DeptFlow 360 - Database Initialization (Zero Sample Data Baseline)
 */

const Faculty = require('../models/Faculty');
const ProjectTeam = require('../models/ProjectTeam');
const Workflow = require('../models/Workflow');
const Notification = require('../models/Notification');
const User = require('../models/User');

const INITIAL_FACULTY = [];
const INITIAL_PROJECT_TEAMS = [];
const INITIAL_WORKFLOWS = [];
const INITIAL_NOTIFICATIONS = [];

const autoSeedDatabase = async () => {
  try {
    // Database starts completely clean with zero sample data.
    // All users, faculty, project teams, and workflows are dynamically created through the UI.
    console.log('🌱 Database initialized with zero sample data baseline. Ready for dynamic records.');
  } catch (err) {
    console.error('⚠️ Database initialization error:', err.message);
  }
};

module.exports = { autoSeedDatabase, INITIAL_FACULTY, INITIAL_PROJECT_TEAMS, INITIAL_WORKFLOWS, INITIAL_NOTIFICATIONS };
