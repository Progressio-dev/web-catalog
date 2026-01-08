const csvService = require('../services/csvService');
const pdfService = require('../services/pdfService');
const { dbGet, dbAll } = require('../config/database');

// Upload and parse CSV
exports.uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = await csvService.parseCSV(req.file.path);
    
    // Clean up the uploaded file after parsing
    const fs = require('fs');
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

// Generate PDF
exports.generatePdf = async (req, res) => {
  try {
    const { items, templateId, logoId, visibleFields, options } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
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

    // Get mappings for template
    let mappings = [];
    if (template) {
      mappings = await dbAll('SELECT * FROM mappings WHERE template_id = ?', [template.id]);
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePdf({
      items,
      template,
      logo,
      mappings,
      visibleFields,
      options
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="catalog-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
