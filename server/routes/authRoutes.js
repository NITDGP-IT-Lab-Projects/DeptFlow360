const express = require('express');
const router = express.Router();
const { signup, signin, getMe, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/login', signin);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);

module.exports = router;
