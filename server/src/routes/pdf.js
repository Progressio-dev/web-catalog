const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const pdfController = require('../controllers/pdfController');
const authMiddleware = require('../middleware/authMiddleware');
const { getUploadDir } = require('../config/paths');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();
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

// General-purpose limiter applied to all non-PDF routes (e.g. CSV upload, admin endpoints).
// Defaults: 60 requests per minute. Override via RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX env vars.
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

// Dedicated limiter for PDF-generation endpoints (/generate-pdf and /preview).
// PDF rendering is CPU-intensive but legitimate batch jobs may generate many PDFs in quick
// succession, so we use a longer window with a much higher ceiling than the global limiter.
// Defaults: 300 requests per 5 minutes. Override via PDF_RATE_LIMIT_WINDOW_MS / PDF_RATE_LIMIT_MAX.
const pdfLimiter = rateLimit({
  windowMs: parseInt(process.env.PDF_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000,
  max: parseInt(process.env.PDF_RATE_LIMIT_MAX, 10) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de génération PDF, veuillez réessayer dans quelques minutes.' }
});

// Public routes
// /upload-csv uses the global limiter (file uploads are less frequent and not batch-heavy)
router.post('/upload-csv', globalLimiter, upload.single('csv'), pdfController.uploadCsv);
// /generate-pdf and /preview use the more permissive PDF-specific limiter to support batch loads
router.post('/generate-pdf', pdfLimiter, pdfController.generatePdf);
router.post('/preview', pdfLimiter, pdfController.generatePreview);

// Protected routes (admin only)
router.use(authMiddleware);
router.post('/templates/analyze-csv', pdfController.analyzeCsv);
router.get('/product-image/:ref', pdfController.getProductImage);

module.exports = router;
