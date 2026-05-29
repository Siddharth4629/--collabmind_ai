const express = require('express');
const { generateIdeas } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/generate', protect, generateIdeas);

module.exports = router;
