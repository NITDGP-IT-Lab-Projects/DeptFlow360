const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false },
  targetRole: { type: String, required: true },
  workflowId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
