const { dbAll, dbGet, dbRun } = require('../config/database');

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
