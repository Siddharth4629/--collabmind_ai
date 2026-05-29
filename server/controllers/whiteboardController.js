const Whiteboard = require('../models/Whiteboard');

// @desc    Get whiteboard by project ID (creates one if not exists)
// @route   GET /api/whiteboard/:projectId
// @access  Private (Project members only)
exports.getWhiteboard = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    
    let whiteboard = await Whiteboard.findOne({ project: projectId });

    if (!whiteboard) {
      // Auto-create whiteboard for project
      whiteboard = await Whiteboard.create({
        project: projectId,
        elements: [],
        updatedBy: req.user._id
      });
    }

    res.status(200).json({ success: true, data: whiteboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update whiteboard elements
// @route   PUT /api/whiteboard/:projectId
// @access  Private (Project members only)
exports.updateWhiteboard = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const { elements } = req.body;

    let whiteboard = await Whiteboard.findOne({ project: projectId });

    if (!whiteboard) {
      whiteboard = await Whiteboard.create({
        project: projectId,
        elements: elements || [],
        updatedBy: req.user._id
      });
    } else {
      whiteboard.elements = elements || [];
      whiteboard.updatedBy = req.user._id;
      await whiteboard.save();
    }

    res.status(200).json({ success: true, data: whiteboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
