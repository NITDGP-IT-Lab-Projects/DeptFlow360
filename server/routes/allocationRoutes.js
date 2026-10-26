const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

router.get('/teams', allocationController.getTeams);
router.get('/quotas', allocationController.getQuotas);
router.post('/match', allocationController.runMatching);
router.post('/override', allocationController.manualOverride);
router.post('/reset', allocationController.resetAllocations);

module.exports = router;
