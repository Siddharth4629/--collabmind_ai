const express = require('express');
const {
  getProjectFiles,
  createFile,
  updateFile,
  deleteFile,
  runCode
} = require('../controllers/codeController');
const { protect, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/:projectId')
  .get(checkProjectAccess('Viewer'), getProjectFiles)
  .post(checkProjectAccess('Member'), createFile);

router.route('/:projectId/run')
  .post(checkProjectAccess('Member'), runCode);

router.route('/:projectId/:fileId')
  .put(checkProjectAccess('Member'), updateFile)
  .delete(checkProjectAccess('Member'), deleteFile);

module.exports = router;
