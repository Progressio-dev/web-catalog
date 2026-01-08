const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all mappings for a template
exports.getMappings = async (req, res) => {
  try {
    const { templateId } = req.query;

    let mappings;
    if (templateId) {
      mappings = await dbAll('SELECT * FROM mappings WHERE template_id = ?', [templateId]);
    } else {
      mappings = await dbAll('SELECT * FROM mappings');
    }

    res.json(mappings);
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
};

// Save mappings for a template
exports.saveMappings = async (req, res) => {
  try {
    const { templateId, mappings } = req.body;

    if (!templateId || !mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: 'Template ID and mappings array are required' });
    }

    // Verify template exists
    const template = await dbGet('SELECT * FROM templates WHERE id = ?', [templateId]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Delete existing mappings for this template
    await dbRun('DELETE FROM mappings WHERE template_id = ?', [templateId]);

    // Insert new mappings
    for (const mapping of mappings) {
      await dbRun(
        'INSERT INTO mappings (template_id, csv_field, pdf_zone) VALUES (?, ?, ?)',
        [templateId, mapping.csv_field, mapping.pdf_zone]
      );
    }

    // Get updated mappings
    const updatedMappings = await dbAll('SELECT * FROM mappings WHERE template_id = ?', [templateId]);
    res.json(updatedMappings);
  } catch (error) {
    console.error('Save mappings error:', error);
    res.status(500).json({ error: 'Failed to save mappings' });
  }
};

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await dbAll('SELECT * FROM settings');
    
    // Convert to object format
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      const existing = await dbGet('SELECT * FROM settings WHERE key = ?', [key]);
      
      if (existing) {
        await dbRun(
          'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
          [value, key]
        );
      } else {
        await dbRun(
          'INSERT INTO settings (key, value) VALUES (?, ?)',
          [key, value]
        );
      }
    }

    // Get updated settings
    const updatedSettings = await dbAll('SELECT * FROM settings');
    const settingsObj = {};
    updatedSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = exports;
