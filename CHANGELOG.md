# Changelog

## Version 2.0.0 - Complete Refactoring (2024)

### 🚀 Major Features

#### Automated Installation & Setup
- **Post-install script** that automatically runs after `npm install`
  - Creates necessary directories (`server/uploads`, `server/generated`, `database`)
  - Checks Puppeteer system dependencies (Linux/Ubuntu/Debian)
  - Initializes database if it doesn't exist
  - Copies `.env.example` to `.env`
  - Displays helpful installation guide

#### Enhanced Template System
- **Multi-format support**: A4, A5, Letter, and Custom dimensions
- **Orientation control**: Portrait and Landscape modes
- **Custom CSV separators**: Comma, semicolon, tab, pipe, and custom
- **Drag & drop template builder** with visual editor
- **Real-time preview** with actual CSV data
- **Element types**:
  - Text fields (with CSV column mapping)
  - Logos
  - Product images (with URL pattern configuration)
  - Lines
  - Rectangles

#### Step-by-Step User Workflow
- **Step 1**: Template selection from active templates
- **Step 2**: CSV upload with automatic separator detection
- **Step 3**: Product selection with live preview
- **Step 4**: PDF generation with progress feedback
- Progress indicator showing current step
- Back navigation between steps

#### Admin Interface Improvements
- **Template Builder**: Complete visual editor for creating templates
  - CSV upload and column detection
  - Page format and orientation configuration
  - Drag & drop canvas with positioning
  - Element properties panel
  - Real-time preview
- **Template List**: Manage all templates
  - Activate/deactivate templates
  - Duplicate templates
  - Edit existing templates
  - Delete templates
- Better organization with sub-components

### 🔧 Backend Enhancements

#### New API Endpoints
- `POST /api/templates/analyze-csv` - Analyze CSV and extract columns
- `POST /api/templates/:id/duplicate` - Duplicate a template
- `POST /api/preview` - Generate preview HTML for a single item

#### Enhanced Services
- **CSV Service**:
  - Support for custom separators
  - Separator detection
  - Better error handling
- **PDF Service**:
  - Multi-format support (A4, A5, Letter, Custom)
  - Landscape/Portrait orientation
  - New element rendering (text, logo, image, line, rectangle)
  - File URL support for logos and product images
  - Better HTML generation

### 📦 Database Updates

#### New Template Columns
- `page_format` (TEXT): A4, A5, Letter, Custom
- `page_orientation` (TEXT): portrait, landscape
- `page_width` (REAL): Custom width in mm
- `page_height` (REAL): Custom height in mm
- `csv_separator` (TEXT): CSV separator character

#### Migration System
- Migration script to add new columns to existing databases
- Automatic migration on post-install
- Backward compatible with existing data

### 📚 Documentation

#### README Updates
- Complete installation instructions
- System dependencies for Puppeteer (Linux/Debian/Ubuntu)
- Troubleshooting section for common Puppeteer issues
- Updated architecture description
- API endpoint documentation

#### New Documentation Files
- `CHANGELOG.md` - Detailed change history
- Migration guides for existing installations

### 🎨 UI/UX Improvements

#### Admin Interface
- Modern, clean design
- Step-by-step workflow with clear indicators
- Visual feedback (hover states, active states)
- Better error messages in French
- Responsive layout

#### User Interface
- Simplified workflow with 4 clear steps
- Visual progress indicator
- Template preview cards
- Two-column product selection (table + preview)
- Better loading states

### 🔐 Security & Performance

- Input validation on all new endpoints
- Sanitization of CSV data
- Better error handling and logging
- Efficient PDF generation with Puppeteer optimization
- File cleanup after processing

### 🛠️ Development

#### New Components (React)

**Admin:**
- `TemplateBuilder.jsx` - Main template creation orchestrator
- `TemplateList.jsx` - Template management
- `TemplateBuilder/CsvUploader.jsx` - CSV upload and analysis
- `TemplateBuilder/PageConfigPanel.jsx` - Page configuration
- `TemplateBuilder/ElementPalette.jsx` - Draggable elements palette
- `TemplateBuilder/TemplateCanvas.jsx` - Drag & drop canvas
- `TemplateBuilder/ElementProperties.jsx` - Element properties editor
- `TemplateBuilder/TemplatePreview.jsx` - Real-time preview

**User:**
- `TemplateSelector.jsx` - Template selection grid
- `ProductSelection.jsx` - Product selection with preview
- `HomeNew.jsx` - New step-based workflow

#### Scripts
- `scripts/post-install.js` - Automated post-installation setup

#### Migrations
- `server/src/migrations/001_add_template_columns.js` - Database migration

### 📋 Technical Specifications

#### Supported Page Formats
```javascript
A4: 210 x 297 mm
A5: 148 x 210 mm
Letter: 215.9 x 279.4 mm
Custom: User-defined dimensions
```

#### Supported CSV Separators
- Comma (,)
- Semicolon (;)
- Tabulation (\t)
- Pipe (|)
- Custom character

#### Element Configuration Structure
```json
{
  "elements": [
    {
      "id": "unique_id",
      "type": "text|logo|image|line|rectangle",
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 50,
      // Type-specific properties...
    }
  ]
}
```

### 🔄 Breaking Changes

- Template structure has changed - old templates need migration
- New required fields in templates table
- API endpoints for template creation require new fields
- CSV upload now requires separator parameter

### 📝 Migration Guide

#### From v1.x to v2.0

1. **Backup your database**:
   ```bash
   cp database/catalog.db database/catalog.db.backup
   ```

2. **Pull the latest code**:
   ```bash
   git pull origin main
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```
   The post-install script will automatically run migrations.

4. **Verify migration**:
   ```bash
   npm run migrate --workspace=server
   ```

5. **Update existing templates** through the admin interface

### 🐛 Bug Fixes

- Fixed CSV parsing with special characters
- Improved PDF generation stability
- Better error handling in template creation
- Fixed logo path resolution issues

### 🙏 Acknowledgments

This major refactoring was designed to provide a more intuitive and powerful template creation system while maintaining backward compatibility and ease of use.

---

## Version 1.0.0 - Initial Release

- Basic CSV upload and PDF generation
- Simple template system
- Admin authentication
- Logo management
- Drag & drop canvas (basic)
- A4 format only
