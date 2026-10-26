const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');

// GET /api/faculty - List all faculty members
exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ role: 1, name: 1 });
    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/notifications - List notifications by role
exports.getNotifications = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.$or = [{ targetRole: role }, { targetRole: 'ALL' }, { targetRole: 'STUDENT' }];
    }
    const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/notifications/mark-read
exports.markNotificationsRead = async (req, res) => {
  try {
    const { role } = req.body;
    let query = {};
    if (role) {
      query.$or = [{ targetRole: role }, { targetRole: 'ALL' }];
    }
    await Notification.updateMany(query, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
