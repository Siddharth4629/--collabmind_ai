const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'collabmind-super-secret-jwt-key-2026-change-in-production');

    // Get user from DB
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific global roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Grant access based on project membership role
// Valid roles in order: 'Viewer' < 'Member' < 'Admin' / Owner
exports.checkProjectAccess = (requiredRole = 'Viewer') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;
      if (!projectId) {
        return res.status(400).json({ success: false, error: 'Project ID is required for access checks' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Owner has full access
      if (project.owner.toString() === req.user._id.toString()) {
        req.project = project;
        req.userProjectRole = 'Admin'; // Owners are treated as Admins of the project
        return next();
      }

      // Check if user is a member
      const member = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        // Global Admins can also access projects
        if (req.user.role === 'Admin') {
          req.project = project;
          req.userProjectRole = 'Admin';
          return next();
        }
        return res.status(403).json({ success: false, error: 'You are not a member of this project' });
      }

      // Verify role hierarchy
      const roleHierarchy = { Viewer: 1, Member: 2, Admin: 3 };
      const userLevel = roleHierarchy[member.role] || 1;
      const requiredLevel = roleHierarchy[requiredRole] || 1;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Requires ${requiredRole} project privileges, but you are a ${member.role}.`
        });
      }

      req.project = project;
      req.userProjectRole = member.role;
      next();
    } catch (err) {
      console.error('Error in checkProjectAccess middleware:', err);
      res.status(500).json({ success: false, error: 'Internal server authorization error' });
    }
  };
};
