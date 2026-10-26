const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['HOD', 'COORDINATOR', 'FACULTY'] 
  },
  designation: { type: String, required: true },
  email: { type: String, required: true },
  specializations: [{ type: String }],
  ugQuotaMax: { type: Number, required: true, default: 3 },
  ugQuotaCurrent: { type: Number, default: 0 },
  pgQuotaMax: { type: Number, required: true, default: 2 },
  pgQuotaCurrent: { type: Number, default: 0 },
  avatar: { type: String, default: '👨‍🏫' },
  room: { type: String, default: 'IT Block' }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);
