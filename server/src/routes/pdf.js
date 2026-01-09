const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pdfController = require('../controllers/pdfController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'csv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Public routes
router.post('/upload-csv', upload.single('csv'), pdfController.uploadCsv);
router.post('/generate-pdf', pdfController.generatePdf);

// Protected routes (admin only)
router.post('/templates/analyze-csv', authMiddleware, pdfController.analyzeCsv);
router.post('/preview', authMiddleware, pdfController.generatePreview);

module.exports = router;
