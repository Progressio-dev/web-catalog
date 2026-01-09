-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates for PDF generation
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  config TEXT NOT NULL,  -- JSON structure for drag & drop elements
  page_format TEXT DEFAULT 'A4',  -- 'A4', 'A5', 'Letter', 'Custom'
  page_orientation TEXT DEFAULT 'portrait',  -- 'portrait', 'landscape'
  page_width REAL,  -- width in mm for custom format
  page_height REAL,  -- height in mm for custom format
  csv_separator TEXT DEFAULT ',',  -- CSV separator character
  background_color TEXT DEFAULT '#FFFFFF',  -- Page background color
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Company logos
CREATE TABLE IF NOT EXISTS logos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mappings between CSV fields and PDF zones
CREATE TABLE IF NOT EXISTS mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER,
  csv_field TEXT NOT NULL,
  pdf_zone TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Global settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_logos_active ON logos(is_active);
CREATE INDEX IF NOT EXISTS idx_mappings_template ON mappings(template_id);
