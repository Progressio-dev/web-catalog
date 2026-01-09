# Usage Guide - Web Catalog v2.0

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Admin Guide](#admin-guide)
4. [User Guide](#user-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Introduction

Web Catalog is a powerful tool for generating professional PDF product sheets from CSV data. Version 2.0 introduces a visual template builder and step-by-step workflow for easy PDF generation.

### Key Features

- **Visual Template Builder**: Create templates with drag & drop
- **Multiple Formats**: A4, A5, Letter, or custom dimensions
- **Flexible CSV**: Support for various separators
- **Real-time Preview**: See changes as you build
- **Batch Generation**: Create PDFs for multiple products at once

## Getting Started

### First Login

1. Navigate to `http://localhost:5173/admin`
2. Use default credentials:
   - Email: `admin@progressio.dev`
   - Password: `Admin123!`
3. **Important**: Change your password immediately!

### Initial Setup

1. **Upload Logos**: Go to Logos section and upload your company logos
2. **Create Template**: Create your first template (see Admin Guide)
3. **Test**: Generate a test PDF with sample data

## Admin Guide

### Creating a Template

#### Step 1: Upload Test CSV

1. Click "New Template" in the Templates section
2. Prepare a CSV file with your product data
3. Select the appropriate CSV separator:
   - Comma (,) - Most common
   - Semicolon (;) - European standard
   - Tab - Excel exports
   - Pipe (|) - Less common
   - Custom - Specify your own
4. Upload the CSV file
5. Review detected columns

**CSV Example**:
```csv
reference,designation,price,description
REF001,Product A,19.99,High quality product
REF002,Product B,29.99,Premium edition
```

#### Step 2: Configure Page

1. Choose page format:
   - **A4** (210 x 297 mm) - Standard
   - **A5** (148 x 210 mm) - Compact
   - **Letter** (215.9 x 279.4 mm) - US standard
   - **Custom** - Enter your own dimensions

2. Select orientation:
   - **Portrait** (📄) - Vertical
   - **Landscape** (📃) - Horizontal

3. Click "Continue"

#### Step 3: Build Template

##### Adding Elements

**From CSV Columns**:
1. Click on any column name in the left sidebar
2. Element appears on canvas
3. Drag to position
4. Resize and style using properties panel

**Special Elements**:
1. Click element button (Logo, Image, Line, Rectangle)
2. Configure in properties panel
3. Position on canvas

##### Element Types

**Text (CSV Column)**:
- Maps to CSV column data
- Customize font, size, color
- Set alignment and style
- Enable word wrap

**Logo**:
- Select from uploaded logos
- Resize to fit
- Position anywhere

**Product Image**:
- Map to CSV column (e.g., "image_ref")
- Set base URL: `https://cdn.example.com/products/`
- Set extension: `.jpg`
- Final URL: `base_url + column_value + extension`

**Line**:
- Visual separator
- Set thickness and color
- Use for section divisions

**Rectangle**:
- Decorative boxes
- Set fill color and border
- Use for highlights

##### Properties Panel

Select any element to see its properties:

**Position & Size**:
- X, Y coordinates
- Width, Height

**Text Properties** (for text elements):
- CSV Column mapping
- Font family
- Font size (8-72px)
- Color
- Bold, Italic
- Alignment (Left, Center, Right)
- Word wrap

**Image Properties** (for product images):
- CSV column (reference)
- Base URL
- Extension
- Fit mode (contain, cover, fill)

#### Step 4: Preview & Save

1. View real-time preview with actual CSV data
2. Navigate between CSV rows to test different data
3. Enter template name
4. Click "Save Template"

### Managing Templates

#### Template List

View all templates with:
- Name and status (Active/Inactive)
- Page format and orientation
- Creation date

#### Template Actions

**Edit**: Modify existing template
**Duplicate**: Create copy of template
**Activate/Deactivate**: Control visibility to users
**Delete**: Remove template (confirmation required)

### Managing Logos

1. Go to Logos section
2. Click "Upload Logo"
3. Select image file (PNG, JPG, SVG)
4. Logo appears in list
5. Toggle active/inactive
6. Delete unused logos

### Settings

Configure global settings:
- Product image base URL
- Default CSV separator
- Other application settings

## User Guide

### Generating PDFs - 4 Steps

#### Step 1: Select Template

1. View available templates in grid
2. See preview and format info
3. Click "Use this template" on desired template

#### Step 2: Upload CSV

1. Drag & drop your CSV file
   OR
   Click to browse and select
2. Separator is auto-detected from template
3. System analyzes file and shows:
   - Number of rows detected
   - Columns found
4. Validation against template requirements

**Important**: Your CSV must contain all columns used in the template!

#### Step 3: Select Products

**Product Table** (Left):
- All CSV rows displayed
- Checkbox to select/deselect
- "Select All" / "Deselect All" buttons
- Selected count shown

**Preview** (Right):
- Live preview of selected products
- Navigate with ← → buttons
- Shows how PDF will look

**Tips**:
- Select products you want in PDF
- Use preview to verify data
- Check that images load correctly

#### Step 4: Generate PDF

1. Review summary:
   - Template name
   - Number of products
2. Click "Generate PDF"
3. Wait for generation (progress bar)
4. PDF downloads automatically

**Generation Options** (if available):
- **Single PDF**: All products in one file
- **Multiple PDFs**: One file per product

### Tips for Best Results

#### CSV Preparation

1. **Clean Data**:
   - Remove empty rows
   - Ensure consistent formatting
   - Check for special characters

2. **Column Names**:
   - Use clear, descriptive names
   - Avoid spaces (use underscores)
   - Be consistent

3. **Image References**:
   - Use consistent naming
   - Verify images exist at URLs
   - Test a few before batch generation

#### Template Selection

1. **Choose Right Format**:
   - A4 for detailed sheets
   - A5 for compact catalogs
   - Landscape for wide tables

2. **Test First**:
   - Generate with 1-2 products first
   - Verify all data appears correctly
   - Check image loading

## Best Practices

### For Administrators

1. **Create Multiple Templates**:
   - Different formats for different needs
   - Branded templates per client
   - Seasonal variations

2. **Use Descriptive Names**:
   - Include format in name: "Product Sheet - A4 Portrait"
   - Add version if iterating: "Catalog 2024 v2"

3. **Test Thoroughly**:
   - Use real data for testing
   - Check all CSV columns
   - Verify image URLs

4. **Keep Templates Active**:
   - Deactivate outdated templates
   - Don't delete if historical PDFs reference them

5. **Backup**:
   - Regular database backups
   - Export template configurations
   - Save logo files separately

### For Users

1. **Prepare CSV**:
   - Validate data before upload
   - Use correct separator
   - Check for required columns

2. **Image URLs**:
   - Ensure images are accessible
   - Use HTTPS for security
   - Optimize image sizes

3. **Batch Size**:
   - Start with small batches (10-20)
   - Large batches (100+) may be slower
   - Consider splitting very large catalogs

4. **Preview First**:
   - Always check preview
   - Verify data mapping
   - Ensure images load

## Troubleshooting

### Common Issues

#### "Template not found" or "No active templates"

**Cause**: No templates activated or user doesn't have access

**Solution**:
1. Admin: Go to Templates, activate at least one
2. Verify template is marked as "Active"

#### "CSV columns missing"

**Cause**: CSV doesn't contain all required columns

**Solution**:
1. Check template requirements
2. Ensure CSV has all needed columns
3. Check column name spelling

#### "Image not loading" in preview/PDF

**Cause**: Image URL incorrect or image doesn't exist

**Solution**:
1. Verify base URL is correct
2. Check image reference in CSV
3. Ensure image files exist at URL
4. Test URL in browser

#### PDF generation fails

**Causes**: Various

**Solutions**:
1. Check browser console for errors
2. Reduce batch size
3. Verify all data is valid
4. Check server logs
5. Ensure Puppeteer dependencies installed

#### Drag & drop not working

**Cause**: Browser compatibility

**Solution**:
1. Use modern browser (Chrome, Firefox, Edge)
2. Clear browser cache
3. Disable browser extensions
4. Try incognito/private mode

## Keyboard Shortcuts

### Template Builder

- `Delete` - Delete selected element
- `Arrow keys` - Move element (when selected)
- `Ctrl/Cmd + S` - Save template
- `Ctrl/Cmd + Z` - Undo (if implemented)

### General

- `Ctrl/Cmd + /` - Show help
- `Esc` - Close modals/dialogs

## Advanced Features

### Custom Dimensions

For non-standard page sizes:
1. Select "Custom" format
2. Enter width in mm
3. Enter height in mm
4. Continue to builder

**Common Custom Sizes**:
- Business card: 85 x 55 mm
- Flyer: 210 x 210 mm (square)
- Poster: 420 x 594 mm (A2)

### URL Patterns for Images

Product image URLs are built as:
```
{baseUrl}{columnValue}{extension}
```

**Example**:
- Base URL: `https://cdn.example.com/products/`
- Column value: `PROD123`
- Extension: `.jpg`
- Result: `https://cdn.example.com/products/PROD123.jpg`

**Variations**:
- Different folders: `https://cdn.example.com/images/{category}/`
- No extension: Leave extension blank
- Complex patterns: Consider preprocessing CSV

## Support & Resources

### Documentation
- README.md - Installation and setup
- CHANGELOG.md - Version history
- MIGRATION_GUIDE.md - Upgrade instructions

### Getting Help

1. Check this guide
2. Review README troubleshooting
3. Check browser console
4. Review server logs
5. Open GitHub issue

### Reporting Bugs

Include:
- Version number
- Steps to reproduce
- Error messages
- Browser/OS info
- Sample data (anonymized)

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**License**: MIT
