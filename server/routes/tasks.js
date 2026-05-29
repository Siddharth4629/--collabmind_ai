const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Require login for all task operations

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);

module.exports = router;
