const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const logoController = require('../controllers/logoController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, SVG) are allowed'));
    }
  }
});

// Public route to get active logos
router.get('/', logoController.getLogos);

// Protected routes
router.get('/:id', authMiddleware, logoController.getLogo);
router.post('/', authMiddleware, upload.single('logo'), logoController.createLogo);
router.put('/:id', authMiddleware, logoController.updateLogo);
router.delete('/:id', authMiddleware, logoController.deleteLogo);

module.exports = router;
