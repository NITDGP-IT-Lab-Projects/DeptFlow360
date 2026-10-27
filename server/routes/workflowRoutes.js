const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

router.get('/', workflowController.getWorkflows);
router.post('/reset', workflowController.resetWorkflows);
router.get('/:id', workflowController.getWorkflowById);
router.post('/', workflowController.createWorkflow);
router.post('/:id/transition', workflowController.transitionWorkflow);
router.put('/:id/transition', workflowController.transitionWorkflow);
router.post('/:id/milestones/:milestoneId/evaluate', workflowController.evaluateMilestone);

module.exports = router;
