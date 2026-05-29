const express = require('express');
const { register, login, getMe, updateDetails, searchUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateDetails);
router.get('/users/search', protect, searchUsers);

module.exports = router;
