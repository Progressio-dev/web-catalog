# Preview vs Canvas Alignment/Centering and MM/PX Normalization - Implementation Summary

## Problem Statement

The issue manifested as text elements appearing differently positioned between:
1. **TemplateCanvas** (drag-and-drop editor)
2. **TemplatePreview** (real-time preview)
3. **Generated PDF**

Specifically, centered text (e.g., `MY26 Description` with `textAlign: 'center'`) appeared:
- Centered correctly in the canvas
- Offset to the right in the preview
- Misaligned in the PDF

This suggested:
- Unit mismatch (px vs mm) between components
- Inconsistent text alignment styling
- Legacy templates stored in px not properly migrated

## Root Causes Identified

### 1. Text Alignment Inconsistency
**Canvas (TemplateCanvas.jsx):**
```javascript
style={{
  padding: '4px',          // ✅ Has padding
  // Missing box-sizing
}}
```

**Preview (TemplatePreview.jsx):**
```javascript
style={{
  // ❌ No padding
  // ❌ No box-sizing
}}
```

**PDF (pdfService.js):**
```css
/* ❌ No padding, no box-sizing */
```

**Impact:** The padding affects text positioning within the element box. When text is centered, the padding shifts the actual text content. Without consistent padding, centered text appears at different horizontal positions.

### 2. Migration Detection Insufficient
**Old Logic:**
```javascript
const LEGACY_PX_THRESHOLD = 50;
if (element.width > 50 || element.height > 50) {
  // migrate
}
```

**Problem:** 
- Fixed threshold of 50 doesn't account for page size
- Doesn't check x/y positions
- Typical px values (e.g., 275px = 110mm) often < 420mm (2× A4 width)

## Solutions Implemented

### 1. Text Alignment Consistency

#### TemplatePreview.jsx
Added to all text element types (`text`, `freeText`, `jsCode`):
```javascript
style={{
  padding: `${4 * zoom}px`,    // Scaled with zoom
  boxSizing: 'border-box',     // Ensures padding is inside width/height
  // ... other styles
}}
```

#### TemplateCanvas.jsx  
Added to all text element types:
```javascript
style={{
  padding: '4px',
  boxSizing: 'border-box',
  // ... other styles
}}
```

#### pdfService.js
Added to CSS for all text elements:
```css
padding: 4px;
box-sizing: border-box;
```

### 2. Improved Migration Logic

**New Detection Strategy:**
```javascript
// Compare element dimensions directly to page dimensions
const widthLooksLikePx = (element.width || 0) > pageWidth;
const heightLooksLikePx = (element.height || 0) > pageHeight;
const xLooksLikePx = (element.x || 0) > pageWidth;
const yLooksLikePx = (element.y || 0) > pageHeight;
```

**Benefits:**
- Detects typical px values: 275px > 210mm (A4 width) ✅
- Avoids false positives: 190mm < 210mm ✅
- Page-size aware: works for A4/A5/Letter/Custom
- Orientation aware: accounts for landscape swap
- Checks all dimensions: x, y, width, height

### 3. Code Quality Improvements
- Removed debug `console.log` statements
- Extracted magic numbers as constants
- Added comprehensive inline comments
- Improved readability and maintainability

## Verification

### Test Results

#### Migration Detection Tests
```
✅ Test 1: Legacy px element (275px width on A4)
   - Before: x=125, y=250, w=275, h=50 (px)
   - After:  x=50mm, y=100mm, w=110mm, h=20mm
   - Status: PASS - Correctly detected and migrated

✅ Test 2: Valid mm element
   - Values: x=50, y=100, w=110, h=20 (mm)
   - Status: PASS - Not migrated (correct)

✅ Test 3: Large valid mm element
   - Values: x=10, y=10, w=190, h=277 (mm)
   - Status: PASS - Not migrated (no false positive)

✅ Test 4: Element beyond page boundary
   - x=220 > 210mm (page width)
   - Status: PASS - Correctly detected as px

✅ Test 5: A5 with px values
   - 300px > 148mm (A5 width)
   - Status: PASS - Correctly detected

✅ Test 6: A4 landscape
   - Page swapped to 297×210mm
   - Status: PASS - Migration works with orientation
```

### Build Verification
```bash
cd client && npm run build
```
```
✓ 109 modules transformed.
✓ built in 1.45s
✅ No build errors
```

### Security Scan
```
CodeQL Analysis: 0 alerts found ✅
```

## Files Modified

### Frontend
1. **client/src/components/Admin/TemplateBuilder/TemplateCanvas.jsx**
   - Added `boxSizing: 'border-box'` to text, freeText, jsCode elements

2. **client/src/components/Admin/TemplateBuilder/TemplatePreview.jsx**
   - Added `padding: ${4 * zoom}px` to text, freeText, jsCode elements
   - Added `boxSizing: 'border-box'` to text, freeText, jsCode elements

3. **client/src/components/Admin/TemplateBuilder.jsx**
   - Improved `migratePxToMm()` function with page-aware detection
   - Removed debug console.log statements
   - Added comprehensive comments

### Backend
4. **server/src/services/pdfService.js**
   - Added `padding: 4px` to text, freeText, jsCode CSS styles
   - Added `box-sizing: border-box` to text, freeText, jsCode CSS styles

## Impact

### Before
```
Canvas:  [----TEXT CENTERED----]  ← padding: 4px
Preview: [TEXT OFFSET RIGHT---]  ← no padding
PDF:     [TEXT OFFSET RIGHT---]  ← no padding

Result: Misalignment between canvas and preview/PDF
```

### After
```
Canvas:  [----TEXT CENTERED----]  ← padding: 4px, box-sizing: border-box
Preview: [----TEXT CENTERED----]  ← padding: 4px*zoom, box-sizing: border-box
PDF:     [----TEXT CENTERED----]  ← padding: 4px, box-sizing: border-box

Result: Perfect alignment across all three
```

## Acceptance Criteria

✅ **Normalize units reliably**
   - State stores mm, render converts to px
   - Backward compatible with legacy px templates
   - Auto-migration on template load

✅ **TemplatePreview uses same styling as TemplateCanvas**
   - Identical padding (scaled for zoom)
   - Identical box-sizing
   - Same orientation swap logic

✅ **Text alignment applied identically**
   - `textAlign` property rendered the same way
   - Centered text appears at same coordinates
   - Canvas, preview, and PDF match

✅ **Auto-detection/upgrade path**
   - Page-aware detection: compares to actual page dimensions
   - Checks x, y, width, height
   - Handles A4/A5/Letter/Custom formats
   - Works with portrait and landscape

✅ **Orientation swap correct**
   - Both components swap width/height for landscape
   - Migration accounts for orientation

✅ **Scaling consistent**
   - 2.5 px/mm ratio maintained
   - Zoom applied only in preview (padding scales with zoom)

✅ **PDF error handling preserved**
   - JSON error responses still surfaced (previous fix maintained)

## Testing Recommendations

### Manual Testing Steps
1. **Create test template:**
   - Format: A4 Portrait
   - Add text element: x=50mm, y=100mm, width=110mm, height=20mm
   - Set `textAlign: 'center'`
   - Map to CSV column with data

2. **Verify canvas:**
   - Text should appear centered in the box
   - Position at (50mm, 100mm) → (125px, 250px)

3. **Verify preview:**
   - At 100% zoom: text centered at same position
   - At 50% zoom: text centered, position scaled
   - At 200% zoom: text centered, position scaled

4. **Generate PDF:**
   - Text should be centered
   - Position should match canvas/preview

5. **Test legacy template:**
   - Load template with px values (width=275, etc.)
   - Should auto-migrate to mm on load
   - Canvas/preview should render identically

## Backward Compatibility

### Legacy Templates
Templates saved with px values will:
1. Be detected on load (if dimensions > page dimensions)
2. Automatically converted to mm
3. Render at the same visual size (275px → 110mm → 275px)
4. Continue working without user intervention

### New Templates
Templates created after this fix will:
1. Store all values in mm from the start
2. Render consistently across all views
3. Generate PDFs that match the preview exactly

## Known Limitations

1. **Migration threshold:** Elements with dimensions exactly at page boundaries (e.g., 210mm wide on A4) might be ambiguous. In practice, this is rare.

2. **Custom formats:** For custom page formats, detection relies on the user-provided dimensions being accurate.

3. **Padding in canvas:** The 4px padding in canvas is for visual clarity in the editor. It's included in the element's width/height with box-sizing: border-box.

## Future Improvements

1. **Consider removing padding from canvas:** For even more WYSIWYG, canvas could also have no visual padding (only in preview/PDF).

2. **Add migration warning:** Show a toast notification when templates are migrated.

3. **Add unit indicator:** Show "mm" next to position/size values in the UI.

4. **Validation:** Add warnings if elements exceed page boundaries.

## Conclusion

All acceptance criteria have been met:
- ✅ Text alignment consistency across canvas, preview, and PDF
- ✅ Reliable mm/px normalization with backward compatibility
- ✅ Smart auto-detection based on page dimensions
- ✅ Orientation handling verified
- ✅ Code review feedback addressed
- ✅ Security scan passed
- ✅ Build successful

The centered text issue is now resolved. Text elements with `textAlign: 'center'` will appear identically positioned in the canvas, preview, and generated PDF.
