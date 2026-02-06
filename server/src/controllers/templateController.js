const { dbAll, dbGet, dbRun } = require('../config/database');
const jwt = require('jsonwebtoken');

// Helper function to check if user is authenticated
const isAuthenticated = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const authenticated = isAuthenticated(req);
    
    // If authenticated (admin), return all templates
    // If not authenticated (public user), return only active templates
    const query = authenticated 
      ? 'SELECT * FROM templates ORDER BY created_at DESC'
      : 'SELECT * FROM templates WHERE is_active = 1 ORDER BY created_at DESC';
    
    const templates = await dbAll(query);
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Get single template
exports.getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticated = isAuthenticated(req);
    
    // If authenticated (admin), allow access to any template
    // If not authenticated (public user), only allow access to active templates
    const query = authenticated
      ? 'SELECT * FROM templates WHERE id = ?'
      : 'SELECT * FROM templates WHERE id = ? AND is_active = 1';
    
    const template = await dbGet(query, [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Create template
exports.createTemplate = async (req, res) => {
  try {
    const { 
      name, 
      config, 
      page_format, 
      page_orientation, 
      page_width, 
      page_height, 
      csv_separator,
      background_color 
    } = req.body;

    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }

    const configJson = typeof config === 'string' ? config : JSON.stringify(config);

    const result = await dbRun(
      `INSERT INTO templates (
        name, config, page_format, page_orientation, 
        page_width, page_height, csv_separator, background_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        configJson,
        page_format || 'A4',
        page_orientation || 'portrait',
        page_width,
        page_height,
        csv_separator || ',',
        background_color || '#FFFFFF'
      ]
    );

    const newTemplate = await dbGet('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      config, 
      is_active, 
      page_format, 
      page_orientation, 
      page_width, 
      page_height, 
      csv_separator,
      background_color 
    } = req.body;

    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const configJson = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : template.config;
    const newName = name !== undefined ? name : template.name;
    const newIsActive = is_active !== undefined ? is_active : template.is_active;
    const newPageFormat = page_format !== undefined ? page_format : template.page_format;
    const newPageOrientation = page_orientation !== undefined ? page_orientation : template.page_orientation;
    const newPageWidth = page_width !== undefined ? page_width : template.page_width;
    const newPageHeight = page_height !== undefined ? page_height : template.page_height;
    const newCsvSeparator = csv_separator !== undefined ? csv_separator : template.csv_separator;
    const newBackgroundColor = background_color !== undefined ? background_color : template.background_color;

    await dbRun(
      `UPDATE templates SET 
        name = ?, 
        config = ?, 
        is_active = ?,
        page_format = ?,
        page_orientation = ?,
        page_width = ?,
        page_height = ?,
        csv_separator = ?,
        background_color = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        newName, 
        configJson, 
        newIsActive,
        newPageFormat,
        newPageOrientation,
        newPageWidth,
        newPageHeight,
        newCsvSeparator,
        newBackgroundColor,
        id
      ]
    );

    const updatedTemplate = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await dbRun('DELETE FROM templates WHERE id = ?', [id]);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Duplicate template
exports.duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    // Create duplicate with new name
    const newName = `${template.name} (copie)`;
    
    const result = await dbRun(
      `INSERT INTO templates (
        name, config, page_format, page_orientation, 
        page_width, page_height, csv_separator, background_color, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newName,
        template.config,
        template.page_format || 'A4',
        template.page_orientation || 'portrait',
        template.page_width,
        template.page_height,
        template.csv_separator || ',',
        template.background_color || '#FFFFFF',
        0  // Inactive by default
      ]
    );

    const newTemplate = await dbGet('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: 'Échec de la duplication du template' });
  }
};

// Export template
exports.exportTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    // Create export object with all necessary data
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      template: {
        name: template.name,
        config: template.config,
        page_format: template.page_format,
        page_orientation: template.page_orientation,
        page_width: template.page_width,
        page_height: template.page_height,
        csv_separator: template.csv_separator,
        background_color: template.background_color,
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${template.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Export template error:', error);
    res.status(500).json({ error: 'Échec de l\'export du template' });
  }
};

// Import template
exports.importTemplate = async (req, res) => {
  try {
    const { templateData } = req.body;

    if (!templateData) {
      return res.status(400).json({ error: 'Données du template manquantes' });
    }

    let data;
    try {
      // Parse if it's a string
      data = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;
    } catch (parseError) {
      return res.status(400).json({ error: 'Format JSON invalide' });
    }

    // Validate structure
    if (!data.template || !data.template.name || !data.template.config) {
      return res.status(400).json({ error: 'Structure du template invalide' });
    }

    const { template } = data;

    // Ensure config is a string
    const configJson = typeof template.config === 'string' 
      ? template.config 
      : JSON.stringify(template.config);

    // Create new template from imported data
    const result = await dbRun(
      `INSERT INTO templates (
        name, config, page_format, page_orientation, 
        page_width, page_height, csv_separator, background_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${template.name} (Importé)`,
        configJson,
        template.page_format || 'A4',
        template.page_orientation || 'portrait',
        template.page_width,
        template.page_height,
        template.csv_separator || ',',
        template.background_color || '#FFFFFF'
      ]
    );

    const newTemplate = await dbGet('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Import template error:', error);
    res.status(500).json({ error: 'Échec de l\'import du template' });
  }
};
