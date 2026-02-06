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

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

// Apply rate limiting to all routes
router.use(globalLimiter);

// Public routes
router.post('/upload-csv', upload.single('csv'), pdfController.uploadCsv);
router.post('/generate-pdf', pdfController.generatePdf);
router.post('/preview', pdfController.generatePreview);

// Protected routes (admin only)
router.use(authMiddleware);
router.post('/templates/analyze-csv', pdfController.analyzeCsv);
router.get('/product-image/:ref', pdfController.getProductImage);

module.exports = router;
