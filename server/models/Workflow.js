const mongoose = require('mongoose');

const HistoryItemSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  comment: { type: String, default: '' },
  statusFrom: { type: String, required: true },
  statusTo: { type: String, required: true }
}, { _id: false });

const MilestoneSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  deadline: { type: String, required: true },
  weightage: { type: Number, required: true },
  maxScore: { type: Number, default: 100 },
  score: { type: Number, default: null },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUBMITTED', 'EVALUATED'], 
    default: 'PENDING' 
  },
  submissionUrl: { type: String, default: null },
  feedback: { type: String, default: '' },
  evaluator: { type: String, default: null },
  evaluatedAt: { type: String, default: null },
  rubricScores: { type: Map, of: Number, default: {} }
}, { _id: false });

const WorkflowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['UG_PROJECT', 'PG_DISSERTATION', 'LEAVE_NOC', 'LAB_EQUIPMENT']
  },
  title: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['UG', 'PG', 'DEPARTMENTAL']
  },
  submittedBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    rollNo: { type: String, default: 'N/A' },
    email: { type: String, default: '' },
    degree: { type: String, default: '' },
    teamMembers: [{ type: String }]
  },
  details: {
    domain: { type: String, default: 'General IT' },
    abstract: { type: String, default: '' },
    proposedGuideId: { type: String, default: null },
    allocatedGuideId: { type: String, default: null },
    guideName: { type: String, default: null },
    budgetEstimated: { type: String, default: null },
    purpose: { type: String, default: null },
    referencesCount: { type: Number, default: 4 },
    racPanel: [{ type: String }],
    scopusTarget: { type: String, default: null }
  },
  state: {
    type: String,
    required: true,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'UNDER_GUIDE_REVIEW',
      'UNDER_COORDINATOR_REVIEW',
      'UNDER_HOD_REVIEW',
      'APPROVED',
      'REVISION_REQUESTED',
      'REJECTED'
    ],
    default: 'UNDER_GUIDE_REVIEW'
  },
  slaDaysRemaining: { type: Number, default: 7 },
  sanctionDate: { type: String, default: null },
  sanctionLetterUrl: { type: String, default: null },
  history: [HistoryItemSchema],
  milestones: [MilestoneSchema]
}, { timestamps: true });

module.exports = mongoose.model('Workflow', WorkflowSchema);
