const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes - accessible without authentication for PDF generation workflow
router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);

// Protected routes - require authentication for admin operations
router.get('/:id/export', authMiddleware, templateController.exportTemplate);
router.post('/', authMiddleware, templateController.createTemplate);
router.post('/import', authMiddleware, templateController.importTemplate);
router.put('/:id', authMiddleware, templateController.updateTemplate);
router.delete('/:id', authMiddleware, templateController.deleteTemplate);
router.post('/:id/duplicate', authMiddleware, templateController.duplicateTemplate);

module.exports = router;
