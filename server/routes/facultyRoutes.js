const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

router.get('/', facultyController.getFaculty);
router.get('/notifications', facultyController.getNotifications);
router.post('/notifications/mark-read', facultyController.markNotificationsRead);

module.exports = router;
