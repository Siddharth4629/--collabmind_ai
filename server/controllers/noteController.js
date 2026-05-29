const Note = require('../models/Note');
const Activity = require('../models/Activity');

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

// @desc    Get all project notes
// @route   GET /api/notes?project=projectId
// @access  Private (Project members only)
exports.getNotes = async (req, res, next) => {
  try {
    const projectId = req.query.project;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    const notes = await Note.find({ project: projectId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: notes.length, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single note details
// @route   GET /api/notes/:id
// @access  Private (Project members only)
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private (Project members only)
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, project: projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ success: false, error: 'Note title and project ID are required' });
    }

    const note = await Note.create({
      title,
      content: content || '',
      project: projectId,
      versions: [
        {
          content: content || '',
          updatedBy: req.user._id,
          createdAt: new Date()
        }
      ]
    });

    await logActivity(
      projectId,
      req.user._id,
      'Note Created',
      `Created note "${title}".`
    );

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update note content & record version history
// @route   PUT /api/notes/:id
// @access  Private (Project members only)
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    // Save previous version if content changes
    if (content !== undefined && content !== note.content) {
      note.versions = note.versions || [];
      // Keep up to last 15 versions to conserve space
      if (note.versions.length >= 15) {
        note.versions.shift();
      }
      note.versions.push({
        content: note.content,
        updatedBy: req.user._id,
        createdAt: new Date()
      });
      note.content = content;
    }

    note.title = title || note.title;
    await note.save();

    await logActivity(
      note.project,
      req.user._id,
      'Note Edited',
      `Edited note "${note.title}".`
    );

    res.status(200).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private (Project members only)
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const projectId = note.project;
    const title = note.title;

    await Note.findByIdAndDelete(req.params.id);

    await logActivity(
      projectId,
      req.user._id,
      'Note Deleted',
      `Deleted note "${title}".`
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
