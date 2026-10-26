const mongoose = require('mongoose');

const ProjectTeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['UG', 'PG'] },
  leadName: { type: String, required: true },
  members: [{ type: String }],
  avgCgpa: { type: Number, required: true },
  domain: { type: String, required: true },
  title: { type: String, required: true },
  preferences: [{ type: String }], // Array of Faculty IDs (Ranked #1, #2, #3)
  allocatedGuideId: { type: String, default: null },
  status: { 
    type: String, 
    required: true,
    enum: [
      'UNALLOCATED', 
      'ALLOCATED', 
      'MANUALLY_ALLOCATED', 
      'PENDING_HOD_CLEARANCE', 
      'UNALLOCATED_OVERFLOW'
    ],
    default: 'UNALLOCATED' 
  },
  workflowId: { type: String, default: null },
  overrideAudit: {
    timestamp: { type: String },
    by: { type: String },
    reason: { type: String },
    previousGuide: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectTeam', ProjectTeamSchema);
