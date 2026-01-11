# Visual Verification Guide

## How to Verify the Fixes

### 1. Canvas and Preview Match

**Test Steps:**
1. Open the admin template builder
2. Create a new template with A5 Portrait format
3. Add a text element at position (20mm, 20mm) with size (80mm × 12mm)
4. Check that:
   - Canvas shows element at correct position
   - Preview shows element at same position
   - Both use the same scaling

**Expected Behavior:**
- Element appears in top-left area on both canvas and preview
- When you drag the element on canvas, preview updates in sync
- Zoom controls in preview scale the entire view proportionally

### 2. Orientation Swap Works

**Test Steps:**
1. Create template with A4 Portrait (210×297mm)
2. Add an element and note its position
3. Switch to A4 Landscape
4. Observe that:
   - Canvas dimensions change to 297×210mm
   - Preview dimensions match canvas
   - Element stays in correct relative position

**Expected Behavior:**
- Portrait: Taller than wide
- Landscape: Wider than tall
- Page info shows correct dimensions
- Elements don't get cut off or repositioned incorrectly

### 3. PDF Matches Preview

**Test Steps:**
1. Create a simple template with:
   - A5 Portrait format
   - Background color: #E3F2FD (light blue)
   - Text element: "Test Document"
   - Position: (20mm, 20mm)
2. Upload CSV with test data
3. Generate PDF
4. Compare PDF with preview:
   - Page size should be A5
   - Background color should match
   - Text position should match exactly

**Expected Behavior:**
- PDF page dimensions match preview
- Element positions are identical
- Background color is preserved
- Text is readable and not cut off

### 4. Error Handling

**Test Steps:**
1. Try to generate PDF without selecting a template (if possible)
2. Or modify backend to return an error response
3. Check that:
   - No corrupt PDF is downloaded
   - Error toast appears with clear message
   - User can retry or go back

**Expected Behavior:**
- Error message in French: "Erreur lors de la génération du PDF"
- No file download occurs
- No JSON text visible to user

### 5. Legacy Template Migration

**Test Steps:**
1. If you have an old template (created before this fix):
   - Open it in the editor
   - Elements should appear in correct positions
   - Element properties panel should show correct dimensions
2. Make a small change and save
3. Re-open the template
4. Verify elements are still correct

**Expected Behavior:**
- Old templates load without errors
- Positions and sizes are preserved
- No visual difference from before
- New templates use mm natively

## Visual Indicators of Success

### ✅ Canvas
- Elements are crisp and properly sized
- Grid background is visible
- Page info shows format and dimensions in mm
- Selected element has blue border with 8 resize handles

### ✅ Preview  
- Matches canvas exactly (accounting for zoom)
- Zoom controls work (50% to 200%)
- Row navigation works if CSV loaded
- Background color is applied

### ✅ PDF
- Opens in PDF viewer at correct page size
- Background color matches preview
- All elements are positioned correctly
- Text is clear and readable
- No elements are cut off

## Common Issues to Watch For

### ❌ Bad Signs
- Elements appear tiny or huge
- Canvas and preview show different positions
- PDF elements are misaligned
- Landscape shows portrait dimensions
- Error downloads as corrupt file

### ✅ Good Signs
- Canvas === Preview === PDF (visually identical)
- Dragging feels smooth and natural
- Orientation swap is instant and correct
- Error messages are clear and in French
- Old templates still work

## Measurement Verification

To verify exact measurements:

1. **A4 Portrait**: 210mm × 297mm
   - Canvas width: 525px (210 × 2.5)
   - Canvas height: 742.5px (297 × 2.5)

2. **A5 Portrait**: 148mm × 210mm
   - Canvas width: 370px (148 × 2.5)
   - Canvas height: 525px (210 × 2.5)

3. **A4 Landscape**: 297mm × 210mm
   - Canvas width: 742.5px (297 × 2.5)
   - Canvas height: 525px (210 × 2.5)

4. **Element (80mm × 12mm)**:
   - Rendered width: 200px (80 × 2.5)
   - Rendered height: 30px (12 × 2.5)

Use browser DevTools to inspect element dimensions and verify they match expected pixel values.

## Testing Checklist

- [ ] Create new template - elements appear correctly
- [ ] Switch between portrait/landscape - dimensions swap
- [ ] Drag elements - position updates in mm
- [ ] Resize elements - size updates in mm
- [ ] Zoom preview - all elements scale proportionally
- [ ] Generate PDF - matches preview exactly
- [ ] Test with A4, A5, Letter formats - all work
- [ ] Test custom page size - dimensions respected
- [ ] Upload CSV and preview data - data displays correctly
- [ ] Trigger PDF error - clear message shown
- [ ] Open old template - still works correctly
- [ ] Save and reload template - no data loss
