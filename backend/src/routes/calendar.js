const express = require('express');
const router = express.Router();
const { getCalendarEvents } = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All calendar routes require authentication
router.use(authMiddleware);

router.get('/events', getCalendarEvents);

module.exports = router;
