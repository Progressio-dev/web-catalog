const csvService = require('../services/csvService');
const pdfService = require('../services/pdfService');
const { dbGet, dbAll } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for temporary CSV uploads
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `temp-${Date.now()}-${file.originalname}`);
  }
});

const tempUpload = multer({ storage: tempStorage });

// Upload and analyze CSV (for template creation)
exports.analyzeCsv = [
  tempUpload.single('csv'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
      }

      const { separator } = req.body;

      const csvData = await csvService.parseCSV(req.file.path, separator || ',');

      // Clean up the uploaded file after parsing
      fs.unlinkSync(req.file.path);

      res.json({
        columns: csvData.fields,
        preview: csvData.data.slice(0, 5), // First 5 rows for preview
        totalRows: csvData.data.length
      });
    } catch (error) {
      console.error('Analyze CSV error:', error);
      res.status(500).json({ error: 'Échec de l\'analyse du fichier CSV' });
    }
  }
];

// Upload and parse CSV
exports.uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = await csvService.parseCSV(req.file.path);
    
    // Clean up the uploaded file after parsing
    fs.unlinkSync(req.file.path);

    res.json({
      data: csvData.data,
      fields: csvData.fields,
      count: csvData.data.length
    });
  } catch (error) {
    console.error('Upload CSV error:', error);
    res.status(500).json({ error: 'Failed to parse CSV file' });
  }
};

// Generate PDF preview for a single item
exports.generatePreview = async (req, res) => {
  try {
    const { templateId, rowData } = req.body;

    if (!templateId || !rowData) {
      return res.status(400).json({ error: 'templateId et rowData sont requis' });
    }

    // Get template
    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [templateId]);
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    // Get logos if needed
    const logos = await dbAll('SELECT * FROM logos WHERE is_active = 1');

    // Generate preview HTML
    const previewHtml = await pdfService.generatePreviewHtml({
      item: rowData,
      template,
      logos
    });

    res.json({ html: previewHtml });
  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({ error: 'Échec de la génération de l\'aperçu' });
  }
};

// Generate PDF
exports.generatePdf = async (req, res) => {
  try {
    const { items, templateId, logoId, visibleFields, options, selectedRows } = req.body;

    // Support both 'items' and 'selectedRows' parameter names
    const dataItems = items || selectedRows;

    if (!dataItems || dataItems.length === 0) {
      return res.status(400).json({ error: 'Aucun élément fourni' });
    }

    // Get template
    let template = null;
    if (templateId) {
      template = await dbGet('SELECT * FROM templates WHERE id = ? AND is_active = 1', [templateId]);
    } else {
      // Get first active template as default
      template = await dbGet('SELECT * FROM templates WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1');
    }

    // Get logo if specified
    let logo = null;
    if (logoId) {
      logo = await dbGet('SELECT * FROM logos WHERE id = ? AND is_active = 1', [logoId]);
    }

    // Load all active logos for template elements that may reference them
    const allLogos = await dbAll('SELECT * FROM logos WHERE is_active = 1');

    // Generate PDF
    const pdfBuffer = await pdfService.generatePdf({
      items: dataItems,
      template,
      logo,
      allLogos, // Pass all logos for element rendering
      visibleFields,
      options
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="catalog-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Échec de la génération du PDF' });
  }
};
