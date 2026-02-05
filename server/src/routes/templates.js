const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route - get active templates for PDF generation
router.get('/public', templateController.getActiveTemplates);

// All other template routes are protected
router.use(authMiddleware);

router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);
router.get('/:id/export', templateController.exportTemplate);
router.post('/', templateController.createTemplate);
router.post('/import', templateController.importTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/duplicate', templateController.duplicateTemplate);

module.exports = router;
