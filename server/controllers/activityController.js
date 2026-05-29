const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Get project activity log feed
// @route   GET /api/activity/project/:projectId
// @access  Private (Project members only)
exports.getActivityFeed = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    let activities;
    if (process.env.USE_MOCK_DB === 'true') {
      const allActivities = await Activity.find({ project: projectId }).populate('user');
      // Populate user details manually for mock DB
      for (const act of allActivities) {
        if (act.user && typeof act.user === 'string') {
          const userDoc = await User.findById(act.user);
          act.user = userDoc ? { _id: userDoc._id, name: userDoc.name } : act.user;
        }
      }
      activities = allActivities;
    } else {
      activities = await Activity.find({ project: projectId })
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.status(200).json({ success: true, count: activities.length, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
