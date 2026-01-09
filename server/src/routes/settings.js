const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Settings - all protected
router.get('/api/settings', authMiddleware, settingsController.getSettings);
router.put('/api/settings', authMiddleware, settingsController.updateSettings);

module.exports = router;
