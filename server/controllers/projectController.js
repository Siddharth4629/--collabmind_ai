const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Helper to log project activity
const logActivity = async (projectId, userId, action, details) => {
  try {
    await Activity.create({
      project: projectId,
      user: userId,
      action,
      details
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// @desc    Get all projects user is involved in
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    let projects;

    if (process.env.USE_MOCK_DB === 'true') {
      const allProjects = await Project.find({}).populate('owner').populate('members.user');
      // Filter manually
      projects = allProjects.filter(p => {
        const ownerId = typeof p.owner === 'object' ? p.owner._id : p.owner;
        const isOwner = ownerId === req.user._id.toString();
        const isMember = p.members && p.members.some(m => {
          const mId = typeof m.user === 'object' ? m.user._id : m.user;
          return mId === req.user._id.toString();
        });
        return isOwner || isMember || req.user.role === 'Admin';
      });
    } else {
      let query = {};
      if (req.user.role !== 'Admin') {
        query = {
          $or: [
            { owner: req.user._id },
            { 'members.user': req.user._id }
          ]
        };
      }
      projects = await Project.find(query)
        .populate('owner', 'name email')
        .populate('members.user', 'name email');
    }

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    let project = req.project; // populated in checkProjectAccess middleware
    
    if (process.env.USE_MOCK_DB === 'true') {
      project = await Project.findById(req.params.id);
      await Project.find({}).populate('owner').populate('members.user'); // trigger populates
    }

    // Refresh population
    if (typeof project.populate === 'function') {
      await project.populate('owner', 'name email');
      await project.populate('members.user', 'name email');
    } else {
      // In mock DB, let's load owner and member details manual-style
      const ownerDoc = await User.findById(project.owner);
      project.owner = ownerDoc ? { _id: ownerDoc._id, name: ownerDoc.name, email: ownerDoc.email } : project.owner;
      
      if (project.members) {
        for (let i = 0; i < project.members.length; i++) {
          const userDoc = await User.findById(project.members[i].user);
          if (userDoc) {
            project.members[i].user = { _id: userDoc._id, name: userDoc.name, email: userDoc.email };
          }
        }
      }
    }

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, budget, deadline, status } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      deadline,
      status: status || 'planning',
      budget: {
        total: Number(budget) || 0,
        spent: 0
      },
      members: [
        {
          user: req.user._id,
          role: 'Admin'
        }
      ]
    });

    await logActivity(project._id, req.user._id, 'Project Created', `Project "${name}" was created.`);

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Member only)
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, deadline, status } = req.body;
    let project = req.project;

    project.name = name || project.name;
    project.description = description || project.description;
    project.deadline = deadline || project.deadline;
    project.status = status || project.status;

    await project.save();

    await logActivity(project._id, req.user._id, 'Project Updated', `Project details updated: Status is now "${project.status}".`);

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin / Owner only)
exports.deleteProject = async (req, res, next) => {
  try {
    // Only owner or global Admin can delete
    const isOwner = req.project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only project owners can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:projectId/members
// @access  Private (Admin / Project Owner only)
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const project = req.project;

    // Check if requester is Admin or Owner
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isProjAdmin = project.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'Admin'
    );

    if (!isOwner && !isProjAdmin && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage project members' });
    }

    // Find user to invite
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ success: false, error: 'User not found with this email' });
    }

    // Check if already member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === invitedUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ success: false, error: 'User is already a member of this project' });
    }

    // Add member
    project.members.push({
      user: invitedUser._id,
      role: role || 'Member'
    });

    await project.save();

    await logActivity(
      project._id,
      req.user._id,
      'Member Added',
      `Added "${invitedUser.name}" to the project as "${role || 'Member'}".`
    );

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Admin / Owner only)
exports.removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    const userIdToRemove = req.params.userId;

    // Check if requester is Owner/Admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isProjAdmin = project.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'Admin'
    );

    if (!isOwner && !isProjAdmin && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage members' });
    }

    // Cannot remove owner
    if (project.owner.toString() === userIdToRemove) {
      return res.status(400).json({ success: false, error: 'Cannot remove the project owner' });
    }

    // Remove user
    project.members = project.members.filter(
      (m) => m.user.toString() !== userIdToRemove
    );

    await project.save();

    const userRemoved = await User.findById(userIdToRemove);
    const name = userRemoved ? userRemoved.name : 'Unknown User';

    await logActivity(
      project._id,
      req.user._id,
      'Member Removed',
      `Removed "${name}" from the project.`
    );

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update project budget limit
// @route   POST /api/projects/:projectId/budget
// @access  Private (Admin/Member only)
exports.updateBudget = async (req, res, next) => {
  try {
    const { total } = req.body;
    const project = req.project;

    if (!project.budget) project.budget = { total: 0, spent: 0 };
    project.budget.total = Number(total) || 0;

    await project.save();

    await logActivity(
      project._id,
      req.user._id,
      'Budget Configured',
      `Project total budget limit set to $${project.budget.total}.`
    );

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add project expense
// @route   POST /api/projects/:projectId/expenses
// @access  Private (Admin/Member only)
exports.addExpense = async (req, res, next) => {
  try {
    const { title, amount, category } = req.body;
    const project = req.project;

    if (!title || !amount) {
      return res.status(400).json({ success: false, error: 'Expense title and amount are required' });
    }

    const expenseAmount = Number(amount);
    
    // Create new expense object
    const newExpense = {
      _id: Math.random().toString(16).substring(2, 10),
      title,
      amount: expenseAmount,
      category: category || 'General',
      loggedBy: req.user._id,
      date: new Date()
    };

    project.expenses = project.expenses || [];
    project.expenses.push(newExpense);

    // Recalculate spent
    project.budget = project.budget || { total: 0, spent: 0 };
    project.budget.spent += expenseAmount;

    await project.save();

    // Check budget thresholds
    let alertMessage = null;
    const utilizationRatio = project.budget.total > 0 ? project.budget.spent / project.budget.total : 0;
    
    if (utilizationRatio >= 1.0) {
      alertMessage = `🚨 WARNING: Project budget has been fully depleted! ($${project.budget.spent} spent of $${project.budget.total})`;
    } else if (utilizationRatio >= 0.8) {
      alertMessage = `⚠️ ALERT: Budget utilization is high! You have used ${(utilizationRatio * 100).toFixed(1)}% of your budget ($${project.budget.spent} spent of $${project.budget.total})`;
    }

    await logActivity(
      project._id,
      req.user._id,
      'Expense Logged',
      `Logged expense: "${title}" of $${expenseAmount}. ${alertMessage || ''}`
    );

    res.status(200).json({
      success: true,
      data: project,
      alert: alertMessage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Remove project expense
// @route   DELETE /api/projects/:projectId/expenses/:expenseId
// @access  Private (Admin/Member only)
exports.removeExpense = async (req, res, next) => {
  try {
    const project = req.project;
    const expenseId = req.params.expenseId;

    const expenseIndex = project.expenses.findIndex(e => e._id.toString() === expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, error: 'Expense item not found' });
    }

    const expense = project.expenses[expenseIndex];
    project.budget.spent -= expense.amount;
    if (project.budget.spent < 0) project.budget.spent = 0;

    project.expenses.splice(expenseIndex, 1);
    await project.save();

    await logActivity(
      project._id,
      req.user._id,
      'Expense Deleted',
      `Deleted expense item: "${expense.title}" of $${expense.amount}.`
    );

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all chat logs for a project
// @route   GET /api/projects/:id/chats
// @access  Private (Viewer / Member / Admin)
exports.getProjectChats = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const chats = await Chat.find({ project: projectId }).populate('sender', 'name email role');
    res.status(200).json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
