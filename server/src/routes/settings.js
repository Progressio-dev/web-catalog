const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Mappings - all protected
router.get('/api/mappings', authMiddleware, settingsController.getMappings);
router.put('/api/mappings', authMiddleware, settingsController.saveMappings);

// Settings - all protected
router.get('/api/settings', authMiddleware, settingsController.getSettings);
router.put('/api/settings', authMiddleware, settingsController.updateSettings);

module.exports = router;
