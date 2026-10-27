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

// POST /api/faculty - Register / add a faculty member
exports.createFaculty = async (req, res) => {
  try {
    const { id, name, role, designation, email, specializations, ugQuotaMax, pgQuotaMax, avatar, room } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const facultyId = id || `FAC-${Date.now().toString().slice(-4)}`;
    
    let existing = await Faculty.findOne({ $or: [{ id: facultyId }, { email: normalizedEmail }] });
    if (existing) {
      // Update existing faculty member's profile and quotas
      if (name) existing.name = name.trim();
      if (role) existing.role = role;
      if (designation) existing.designation = designation;
      if (ugQuotaMax !== undefined) existing.ugQuotaMax = Number(ugQuotaMax);
      if (pgQuotaMax !== undefined) existing.pgQuotaMax = Number(pgQuotaMax);
      if (specializations) {
        existing.specializations = Array.isArray(specializations) ? specializations : specializations.split(',').map(s => s.trim());
      }
      if (room) existing.room = room;
      if (avatar) existing.avatar = avatar;
      if (id && existing.id !== id) existing.id = id;
      await existing.save();
      return res.status(200).json({ success: true, data: existing, updated: true });
    }

    const faculty = new Faculty({
      id: facultyId,
      name: name.trim(),
      role: role || 'FACULTY',
      designation: designation || 'Assistant Professor',
      email: normalizedEmail,
      specializations: Array.isArray(specializations) ? specializations : (specializations ? specializations.split(',').map(s => s.trim()) : ['Information Technology']),
      ugQuotaMax: Number(ugQuotaMax) || 3,
      ugQuotaCurrent: 0,
      pgQuotaMax: Number(pgQuotaMax) || 2,
      pgQuotaCurrent: 0,
      avatar: avatar || '👨‍🏫',
      room: room || 'IT Block'
    });

    await faculty.save();
    res.status(201).json({ success: true, data: faculty });
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
