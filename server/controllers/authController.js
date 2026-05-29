const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to sign JWT
const getSignedToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'collabmind-super-secret-jwt-key-2026-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send response with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedToken(user._id);
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Member' // Default to Member
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    let isMatch = false;
    if (process.env.USE_MOCK_DB === 'true') {
      isMatch = await User.matchPassword(password, user.password);
    } else {
      isMatch = await user.matchPassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/me
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Search users by name or email (to invite members)
// @route   GET /api/auth/users/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Search query
    let users = [];
    if (process.env.USE_MOCK_DB === 'true') {
      // In mock DB, get all users and filter in JS
      const allUsers = await User.find({});
      const term = q.toLowerCase();
      users = allUsers.filter(
        (u) =>
          u._id.toString() !== req.user._id.toString() &&
          (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      );
    } else {
      // MongoDB regex search
      users = await User.find({
        _id: { $ne: req.user._id },
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
