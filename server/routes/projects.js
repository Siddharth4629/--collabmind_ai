const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateBudget,
  addExpense,
  removeExpense,
  getProjectChats
} = require('../controllers/projectController');
const { protect, checkProjectAccess } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All project routes require authentication

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(checkProjectAccess('Viewer'), getProject)
  .put(checkProjectAccess('Member'), updateProject)
  .delete(checkProjectAccess('Admin'), deleteProject);

// Member Management
router.post('/:id/members', checkProjectAccess('Admin'), addMember);
router.delete('/:id/members/:userId', checkProjectAccess('Admin'), removeMember);

// Budget & Expenses
router.post('/:id/budget', checkProjectAccess('Member'), updateBudget);
router.post('/:id/expenses', checkProjectAccess('Member'), addExpense);
router.delete('/:id/expenses/:expenseId', checkProjectAccess('Member'), removeExpense);

// Chat Logs
router.get('/:id/chats', checkProjectAccess('Viewer'), getProjectChats);

module.exports = router;
