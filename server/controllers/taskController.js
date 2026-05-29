const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');

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

// @desc    Get all project tasks
// @route   GET /api/tasks?project=projectId
// @access  Private (Project members only)
exports.getTasks = async (req, res, next) => {
  try {
    const projectId = req.query.project;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project query parameter is required' });
    }

    let tasks;
    if (process.env.USE_MOCK_DB === 'true') {
      const allTasks = await Task.find({ project: projectId }).populate('assignee');
      // Populate assignee details manually for mock
      for (const t of allTasks) {
        if (t.assignee && typeof t.assignee === 'string') {
          const userDoc = await User.findById(t.assignee);
          t.assignee = userDoc ? { _id: userDoc._id, name: userDoc.name, email: userDoc.email } : t.assignee;
        }
      }
      tasks = allTasks;
    } else {
      tasks = await Task.find({ project: projectId })
        .populate('assignee', 'name email')
        .populate('comments.user', 'name email')
        .sort({ order: 1 });
    }

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Project members only)
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, project: projectId, assignee, dueDate, subtasks } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ success: false, error: 'Task title and project ID are required' });
    }

    // Get order index (append to end of column)
    const taskCount = await Task.countDocuments({ project: projectId, status: status || 'Todo' });

    const task = await Task.create({
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      project: projectId,
      assignee: assignee || null,
      dueDate: dueDate || null,
      order: taskCount,
      subtasks: subtasks || []
    });

    await logActivity(
      projectId,
      req.user._id,
      'Task Created',
      `Created task "${title}" in column "${status || 'Todo'}".`
    );

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Project members only)
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const { title, description, status, priority, assignee, dueDate, subtasks } = req.body;

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assignee = assignee !== undefined ? assignee : task.assignee;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.subtasks = subtasks || task.subtasks;

    await task.save();

    await logActivity(
      task.project,
      req.user._id,
      'Task Updated',
      `Updated details for task "${task.title}".`
    );

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update task status / column order
// @route   PATCH /api/tasks/:id/status
// @access  Private (Project members only)
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order, projectTasks } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const oldStatus = task.status;
    task.status = status !== undefined ? status : task.status;
    task.order = order !== undefined ? Number(order) : task.order;

    await task.save();

    // If an array of reordered tasks is provided, update all orders in database
    if (projectTasks && Array.isArray(projectTasks)) {
      for (const t of projectTasks) {
        await Task.findByIdAndUpdate(t._id, { order: Number(t.order), status: t.status });
      }
    }

    if (oldStatus !== status) {
      await logActivity(
        task.project,
        req.user._id,
        'Task Moved',
        `Moved task "${task.title}" from "${oldStatus}" to "${status}".`
      );
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project members only)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const projectId = task.project;
    const title = task.title;

    await Task.findByIdAndDelete(req.params.id);

    await logActivity(
      projectId,
      req.user._id,
      'Task Deleted',
      `Deleted task "${title}".`
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private (Project members only)
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!text) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    const comment = {
      _id: Math.random().toString(16).substring(2, 10),
      text,
      user: req.user._id,
      createdAt: new Date()
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
