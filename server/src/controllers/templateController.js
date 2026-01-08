const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await dbAll('SELECT * FROM templates ORDER BY created_at DESC');
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
    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
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
    const { name, config } = req.body;

    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }

    const configJson = typeof config === 'string' ? config : JSON.stringify(config);

    const result = await dbRun(
      'INSERT INTO templates (name, config) VALUES (?, ?)',
      [name, configJson]
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
    const { name, config, is_active } = req.body;

    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const configJson = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : template.config;
    const newName = name || template.name;
    const newIsActive = is_active !== undefined ? is_active : template.is_active;

    await dbRun(
      'UPDATE templates SET name = ?, config = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newName, configJson, newIsActive, id]
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
