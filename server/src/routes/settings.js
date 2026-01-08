const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// All settings routes are protected
router.use(authMiddleware);

// Mappings
router.get('/mappings', settingsController.getMappings);
router.put('/mappings', settingsController.saveMappings);

// Settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

module.exports = router;
