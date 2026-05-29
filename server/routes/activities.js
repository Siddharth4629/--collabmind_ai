const express = require('express');
const { getActivityFeed } = require('../controllers/activityController');
const { protect, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/project/:projectId', protect, checkProjectAccess('Viewer'), getActivityFeed);

module.exports = router;
