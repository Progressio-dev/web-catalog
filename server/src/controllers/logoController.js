const { dbAll, dbGet, dbRun } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { getUploadDir } = require('../config/paths');

// Get all logos (active only for public, all for admin)
exports.getLogos = async (req, res) => {
  try {
    const isAdmin = req.user !== undefined; // If authenticated, it's admin
    const query = isAdmin 
      ? 'SELECT * FROM logos ORDER BY created_at DESC'
      : 'SELECT * FROM logos WHERE is_active = 1 ORDER BY created_at DESC';
    
    const logos = await dbAll(query);
    res.json(logos);
  } catch (error) {
    console.error('Get logos error:', error);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

// Get single logo
exports.getLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const logo = await dbGet('SELECT * FROM logos WHERE id = ?', [id]);
    
    if (!logo) {
      return res.status(404).json({ error: 'Logo not found' });
    }
    
    res.json(logo);
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
};

// Create logo (upload)
exports.createLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name } = req.body;
    const filename = req.file.filename;
    const filePath = `/uploads/${filename}`;

    const result = await dbRun(
      'INSERT INTO logos (name, filename, path) VALUES (?, ?, ?)',
      [name || filename, filename, filePath]
    );

    const newLogo = await dbGet('SELECT * FROM logos WHERE id = ?', [result.lastID]);
    res.status(201).json(newLogo);
  } catch (error) {
    console.error('Create logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};

// Update logo
exports.updateLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const logo = await dbGet('SELECT * FROM logos WHERE id = ?', [id]);
    
    if (!logo) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    const newName = name || logo.name;
    const newIsActive = is_active !== undefined ? is_active : logo.is_active;

    await dbRun(
      'UPDATE logos SET name = ?, is_active = ? WHERE id = ?',
      [newName, newIsActive, id]
    );

    const updatedLogo = await dbGet('SELECT * FROM logos WHERE id = ?', [id]);
    res.json(updatedLogo);
  } catch (error) {
    console.error('Update logo error:', error);
    res.status(500).json({ error: 'Failed to update logo' });
  }
};

// Delete logo
exports.deleteLogo = async (req, res) => {
  try {
    const { id } = req.params;

    const logo = await dbGet('SELECT * FROM logos WHERE id = ?', [id]);
    
    if (!logo) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    // Delete file from disk
    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, logo.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await dbRun('DELETE FROM logos WHERE id = ?', [id]);
    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
};
