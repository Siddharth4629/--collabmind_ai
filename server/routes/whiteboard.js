const express = require('express');
const { getWhiteboard, updateWhiteboard } = require('../controllers/whiteboardController');
const { protect, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/:projectId')
  .get(checkProjectAccess('Viewer'), getWhiteboard)
  .put(checkProjectAccess('Member'), updateWhiteboard);

module.exports = router;
