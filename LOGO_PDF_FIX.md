# Fix: Logo Display in PDF Generation

## Problem Statement

Le logo s'affiche désormais correctement dans le preview en front mais pas dans le PDF.

(The logo now displays correctly in the front-end preview but not in the PDF.)

## Root Cause

When generating PDFs with Puppeteer, the previous implementation used `file://` URLs to reference logo images from the local filesystem. While this approach works in some contexts, Puppeteer may have issues loading local files via `file://` URLs due to:

1. **Browser security restrictions**: Modern browsers (and Puppeteer's Chromium) restrict loading local files via `file://` protocols for security reasons
2. **Path resolution issues**: Depending on the environment, `file://` URLs may not resolve correctly
3. **Asynchronous loading**: The `waitUntil: 'networkidle0'` option may not properly wait for `file://` resources to load

## Solution

Convert logo images to base64 data URLs before embedding them in the PDF HTML. This approach:

1. **Eliminates file:// URL issues**: Data URLs are embedded directly in the HTML, avoiding any file system or network loading
2. **Ensures reliability**: The image data is guaranteed to be available when Puppeteer renders the PDF
3. **Maintains compatibility**: The front-end preview continues to use HTTP URLs (`/uploads/...`) which work correctly with the development server
4. **Proper error handling**: If base64 conversion fails, logs a warning and renders an empty placeholder instead of a broken image

## Changes Made

### 1. Added `imageToDataUrl()` Helper Function

```javascript
function imageToDataUrl(filePath) {
  // Reads image file from disk
  // Detects MIME type based on file extension using lookup table
  // Converts to base64 and returns data URL
  // Returns null if file doesn't exist or read fails
  // Logs warnings/errors for debugging
}
```

Supports: PNG, JPEG, GIF, SVG, WebP

**Error Handling:**
- Returns `null` if file doesn't exist
- Returns `null` if file read fails
- Logs warning/error messages for debugging

### 2. Updated Logo Rendering Logic

Modified three places where logos are rendered:

#### a. Element type 'logo' (lines 178-228)
- When `useHttpUrls = false` (PDF generation), converts logo to base64 data URL
- When `useHttpUrls = true` (preview), uses HTTP URL as before

#### b. Legacy element type 'image' with source 'logo' (lines 230-276)
- Same logic as above for backwards compatibility

#### c. Default template (lines 420-460)
- Converts logo to data URL before embedding in default HTML template

### 3. Behavior by Context

| Context | useHttpUrls | Logo Source |
|---------|-------------|-------------|
| Front-end preview | `true` | HTTP URL (`/uploads/...`) |
| PDF generation | `false` | Base64 data URL (`data:image/...`) |

## Technical Details

### Data URL Format

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
     ↑         ↑      ↑
     MIME type charset base64 encoded image data
```

### Fallback Strategy

If base64 conversion fails (e.g., file doesn't exist or read error):
1. Returns `null` from `imageToDataUrl()`
2. Logs a warning message with the file path
3. Renders an empty placeholder div with an HTML comment
4. Does NOT fall back to `file://` URLs (which were the source of the problem)

This ensures:
- No broken images in the PDF
- Clear error messages in logs for debugging
- Consistent behavior without unpredictable fallbacks

## Impact

- ✅ **Front-end preview**: No change, continues to work correctly
- ✅ **PDF generation**: Now correctly displays logos
- ✅ **Performance**: Minimal impact (base64 conversion happens once per logo per PDF generation)
- ✅ **Security**: No new vulnerabilities introduced (reads from trusted upload directory)
- ✅ **Compatibility**: Works with existing templates and logos

## Testing

To verify the fix:

1. **Upload a logo** via the admin interface
2. **Create or edit a template** with a logo element
3. **Select the logo** in the template editor
4. **Verify preview**: Logo should display in the admin preview
5. **Generate PDF**: Upload CSV, select products, generate PDF
6. **Open PDF**: Logo should now be visible in the PDF

## Files Modified

- `/server/src/services/pdfService.js`: Added base64 conversion and updated logo rendering logic

## Security Considerations

- Images are read from the trusted upload directory only
- File existence is checked before reading
- MIME types are determined by file extension using a lookup table
- Base64 conversion errors are caught and logged with appropriate messages
- No user-controlled paths are used in file operations
- Failed conversions result in empty placeholders, not error messages exposed to users
- No fallback to potentially problematic `file://` URLs

**CodeQL Analysis**: ✅ 0 alerts - No security vulnerabilities detected

## Future Improvements

- Consider caching base64 conversions for frequently used logos
- Add image size validation to prevent excessively large base64 data URLs
- Support for remote logo URLs (HTTP/HTTPS) is already implemented

---

**Date**: January 11, 2026  
**Status**: ✅ Implemented, reviewed, and security-checked  
**Code Review**: ✅ All feedback addressed  
**Security Scan**: ✅ 0 vulnerabilities (CodeQL)

