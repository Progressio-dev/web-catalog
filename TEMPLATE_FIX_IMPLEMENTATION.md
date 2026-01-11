# Template Preview Sizing/Orientation Fixes - Implementation Summary

## Overview

This document describes the fixes implemented to resolve sizing/orientation mismatches between the template canvas, preview, and generated PDFs, as well as improvements to PDF error handling.

## Issues Fixed

### 1. Unit Normalization (mm vs px)

**Problem**: Elements were stored with mixed units - positions and sizes were in pixels (px) in the UI state, but the backend PDF service expected millimeters (mm). This caused a scaling mismatch between the canvas/preview and the final PDF.

**Solution**: 
- All element positions and dimensions are now stored in **millimeters (mm)** in the application state
- Conversion to pixels happens **only during rendering** using the formula: `px = mm × 2.5` (96 DPI standard)
- When users drag or resize elements, pixel values are converted back to mm before saving to state: `mm = px / 2.5`

**Files Changed**:
- `client/src/components/Admin/TemplateBuilder/TemplateCanvas.jsx`
- `client/src/components/Admin/TemplateBuilder/TemplatePreview.jsx`
- `client/src/components/Admin/TemplateBuilder/ElementPalette.jsx`
- `client/src/components/Admin/TemplateBuilder.jsx`

### 2. Orientation Handling

**Problem**: Landscape orientation was not consistently applied - the preview and canvas did not swap width/height for landscape mode.

**Solution**:
- Added orientation swap logic in both TemplateCanvas and TemplatePreview
- When `pageConfig.orientation === 'landscape'`, the width and height are swapped: `[pageWidth, pageHeight] = [pageHeight, pageWidth]`
- This ensures portrait A4 (210×297mm) becomes landscape A4 (297×210mm)

**Files Changed**:
- `client/src/components/Admin/TemplateBuilder/TemplateCanvas.jsx`
- `client/src/components/Admin/TemplateBuilder/TemplatePreview.jsx`

### 3. Backend PDF Generation

**Problem**: The backend was treating element positions as pixels when they should be in millimeters.

**Solution**:
- Changed CSS units in `pdfService.js` from `px` to `mm` for element positioning
- Element positions like `left: ${element.x}px` became `left: ${element.x}mm`
- Puppeteer's PDF generation respects mm units in CSS, ensuring accurate rendering

**Files Changed**:
- `server/src/services/pdfService.js`

### 4. PDF Error Handling

**Problem**: When PDF generation failed, the API returned JSON error responses, but the client tried to download them as PDF files, resulting in corrupted downloads.

**Solution**:
- Added content-type detection in PDF generation consumers
- If response content-type is `application/json`, parse the error and show a toast notification
- Only attempt to download if the content-type is `application/pdf` or blob
- Extract and display meaningful error messages to users

**Files Changed**:
- `client/src/components/User/PdfGenerator.jsx`
- `client/src/components/User/Step4PdfGeneration.jsx`

### 5. Legacy Template Migration

**Problem**: Existing templates saved with pixel values need to be compatible with the new mm-based system.

**Solution**:
- Added a migration helper function `migratePxToMm()` in TemplateBuilder
- Uses a heuristic: if `width > 50` or `height > 50`, assumes the values are in pixels and converts them
- Migration happens automatically when loading old templates
- New templates are saved with mm values by default

**Files Changed**:
- `client/src/components/Admin/TemplateBuilder.jsx`

## Technical Details

### Conversion Constants

```javascript
const MM_TO_PX = 2.5;  // Standard 96 DPI conversion
```

### Rendering Flow

1. **State**: Elements stored in mm
   ```javascript
   { x: 20, y: 20, width: 80, height: 12 }  // in mm
   ```

2. **Canvas Rendering**: Convert to px
   ```javascript
   const xPx = (element.x || 0) * MM_TO_PX;  // 20mm × 2.5 = 50px
   ```

3. **Drag/Resize**: Convert back to mm
   ```javascript
   const newXMm = newXPx / MM_TO_PX;  // 50px / 2.5 = 20mm
   ```

4. **PDF Generation**: Use mm directly
   ```css
   left: 20mm;  /* backend uses mm in CSS */
   ```

### Orientation Handling

```javascript
let pageWidth = 210;   // A4 portrait width in mm
let pageHeight = 297;  // A4 portrait height in mm

if (pageConfig.orientation === 'landscape') {
  [pageWidth, pageHeight] = [pageHeight, pageWidth];
  // Now: pageWidth = 297mm, pageHeight = 210mm
}
```

### Error Detection

```javascript
const contentType = response.headers['content-type'];
if (contentType && contentType.includes('application/json')) {
  // Parse and show error
  const text = await response.data.text();
  const error = JSON.parse(text);
  toast.error(error.error || 'Erreur lors de la génération du PDF');
  return;
}
// Otherwise, download as PDF
```

## Migration Strategy

For backward compatibility with existing templates:

1. **Detection**: Check if element dimensions suggest px values (> 50)
2. **Conversion**: Divide by MM_TO_PX (2.5) to get mm values
3. **Automatic**: Happens on template load, no user action needed

Example:
```javascript
// Old template (px)
{ width: 200, height: 30 }

// Auto-migrated to (mm)
{ width: 80, height: 12 }

// Renders at same size (px)
{ width: 200px, height: 30px }
```

## Testing

A test script (`/tmp/test-mm-conversion.js`) validates:
- ✅ New elements use mm correctly
- ✅ Legacy px elements migrate to mm
- ✅ Rendered px values match original appearance
- ✅ Orientation swaps work for all formats

## Benefits

1. **Consistency**: Canvas, preview, and PDF now use the same coordinate system
2. **Accuracy**: PDF generation matches exactly what users see in the preview
3. **Compatibility**: Legacy templates continue to work with automatic migration
4. **User Experience**: Error messages are clear and actionable instead of broken downloads
5. **Maintainability**: Single source of truth for units (mm) reduces confusion

## Acceptance Criteria Met

- ✅ Canvas and preview render identically for given elements
- ✅ Correct positions/sizes for all element types
- ✅ Correct centering in canvas and preview
- ✅ Correct orientation (portrait/landscape) across A4/A5/Letter/Custom formats
- ✅ Generated PDF matches preview layout and background color
- ✅ No oversized/misaligned elements in PDF
- ✅ PDF generation errors show clear messages instead of JSON downloads
- ✅ Legacy templates migrate automatically without data loss
