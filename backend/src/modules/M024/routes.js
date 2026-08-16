// Express routes for Farmer Groups (M024)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/groups', controller.createFarmerGroup);
router.post('/groups/:groupId/members', controller.addGroupMember);
router.post('/groups/:groupId/meetings', controller.recordGroupMeeting);
router.post('/groups/:groupId/transactions', controller.recordGroupTransaction);
router.get('/groups/:groupId/analytics', controller.getGroupAnalytics);

module.exports = router;
