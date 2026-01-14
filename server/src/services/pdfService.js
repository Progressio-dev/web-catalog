const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const { dbGet } = require('../config/database');
const { getUploadDir, getGeneratedDir } = require('../config/paths');
const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB safety limit

// Enable debug logging via environment variable
const DEBUG_IMAGE_SCRAPING = process.env.DEBUG_IMAGE_SCRAPING === 'true';

// Page format definitions
const PAGE_FORMATS = {
  'A4': { width: 210, height: 297 }, // mm
  'A5': { width: 148, height: 210 },
  'Letter': { width: 215.9, height: 279.4 },
  'Custom': { width: null, height: null } // defined by user
};

const PRODUCT_IMAGE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const productImageCache = new Map();
const FETCH_TIMEOUT_MS = 5000;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const PDF_NAVIGATION_TIMEOUT_MS = 60000;
const PDF_RESOURCE_WAIT_TIMEOUT_MS = 15000;

/**
 * Convert an image file to a base64 data URL
 * @param {string} filePath - Absolute path to the image file
 * @returns {string|null} - Data URL or null if file doesn't exist or read fails
 * 
 * Error cases that return null:
 * - File does not exist
 * - File cannot be read (permission errors)
 * - File read operation fails for any reason
 */
function imageToDataUrl(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Image file not found: ${filePath}`);
      return null;
    }

    try {
      const { size } = fs.statSync(filePath);
      if (size > MAX_INLINE_IMAGE_BYTES) {
        console.warn(`Local image too large to inline (${size} bytes): ${filePath}`);
        return null;
      }
    } catch (statError) {
      console.warn(`Unable to stat image file: ${filePath}`, statError.message);
      return null;
    }
    
    const imageBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Determine MIME type based on file extension
    const mimeTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypeMap[ext] || 'image/png';
    
    const base64Image = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error(`Error converting image to data URL (${filePath}):`, error.message);
    return null;
  }
}

async function fetchRemoteImageAsDataUrl(url) {
  const fetchApi = globalThis.fetch;
  if (typeof fetchApi !== 'function') {
    console.warn('Global fetch API is not available; skipping remote image inlining.');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchApi(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image for PDF (status ${response.status}): ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.toLowerCase().startsWith('image/')) {
      console.warn(`Blocked non-image content-type (${contentType}) for URL: ${url}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_INLINE_IMAGE_BYTES) {
      console.warn(`Image too large after download (${buffer.length} bytes): ${url}`);
      return null;
    }

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error fetching remote image for PDF (${url}):`, error.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * SECURITY NOTE: JavaScript Code Execution
 * 
 * This service executes user-provided JavaScript code for dynamic content generation.
 * Current implementation uses AsyncFunction constructor with basic safeguards:
 * - 5-second timeout to prevent infinite loops
 * - 1000 character output limit
 * - Generic error messages to avoid information disclosure
 * 
 * PRODUCTION RECOMMENDATIONS:
 * - Implement a proper sandbox using 'vm2' or 'isolated-vm'
 * - Add whitelist for allowed global objects and modules
 * - Implement rate limiting per user/template
 * - Log all code executions for audit purposes
 * - Consider disabling fetch/network access in sandboxed environment
 */

function buildImageCacheKey(reference, options = {}) {
  const parts = [
    reference,
    options.pageUrlTemplate || 'default',
    options.imageSelector || 'default',
    options.imageAttribute || 'src',
    options.urlEncodeValue ? 'enc' : 'raw',
    options.baseUrl || '',
    options.extension || '',
    options.csvColumn || '',
    options.elementId || '' // Include element ID to prevent cache sharing between blocks
  ];
  return parts.join('|');
}

/**
 * Escape regex special chars inside a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str = '') {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeColumnName(columnName) {
  return columnName ? columnName.replace(/\s+/g, '_') : null;
}

const GENERIC_TOKEN_PATTERNS = [
  /{{\s*value\s*}}/gi,
  /{\s*value\s*}/gi,
  /%VALUE%/gi,
  /%REFERENCE%/gi,
  /%REF%/gi,
  /%s/gi,
];

/**
 * Inject CSV value into a URL template.
 * Supports generic tokens ({value}, %VALUE%) and column-based tokens (ex: %REFERENCE%).
 * @param {string} template
 * @param {string} value
 * @param {boolean} encodeValue
 * @param {string} [columnName] Column used to allow tokens based on label (ex: %REFERENCE% or %{CODE_ARTICLE}%).
 * @returns {string|null}
 */
function applyValueToTemplate(template, value, encodeValue, columnName) {
  const safeValue = encodeValue ? encodeURIComponent(value) : value;
  if (!template) return null;

  // Normalize column name to allow tokens without spaces (ex: %CODE_PRODUIT%)
  const normalizedColumn = normalizeColumnName(columnName);
  const tokens = [...GENERIC_TOKEN_PATTERNS];

  if (columnName) {
    const escapedCol = escapeRegExp(columnName);
    const escapedNormalized = normalizedColumn ? escapeRegExp(normalizedColumn) : null;
    // Allow matching tokens that use original column label or its underscored variant
    tokens.push(new RegExp(`{{\\s*${escapedCol}\\s*}}`, 'gi'));
    tokens.push(new RegExp(`%${escapedCol}%`, 'gi'));
    if (escapedNormalized && escapedNormalized !== escapedCol) {
      tokens.push(new RegExp(`{{\\s*${escapedNormalized}\\s*}}`, 'gi'));
      tokens.push(new RegExp(`%${escapedNormalized}%`, 'gi'));
    }
  }

  return tokens.reduce((acc, pattern) => acc.replace(pattern, safeValue), template);
}

function normalizeImageUrl(src, pageUrl) {
  if (!src) return null;
  if (src.startsWith('data:')) {
    return src;
  }
  if (src.startsWith('//')) {
    return `https:${src}`;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  try {
    const base = new URL(pageUrl);
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

function shouldUrlEncodeValue(flag) {
  return flag !== false && flag !== 'false';
}

function isRenderableUrl(url) {
  return (
    typeof url === 'string' &&
    (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))
  );
}

function buildFontFaces(customFonts = []) {
  return (customFonts || [])
    .map(
      (font) => `
      @font-face {
        font-family: '${font.name}';
        src: url(${font.dataUrl}) format('${font.format || 'truetype'}');
        font-weight: ${font.weight || 'normal'};
        font-style: ${font.style || 'normal'};
      }
    `
    )
    .join('\n');
}

// Generate preview HTML for a single item
exports.generatePreviewHtml = async ({ item, template, logos, useHttpUrls = true }) => {
  const templateConfig = template ? JSON.parse(template.config) : null;
  
  if (!templateConfig || !templateConfig.elements) {
    return '<div style="padding: 20px;">Aucun élément dans le template</div>';
  }

  const elementPromises = templateConfig.elements.map(element => {
    return renderElement(element, item, logos, template, useHttpUrls);
  });
  
  const elements = await Promise.all(elementPromises);
  const elementsHtml = elements.join('');

  // Get page dimensions exactly as in buildHtml()
  let pageWidth = template.page_format === 'Custom' 
    ? template.page_width 
    : PAGE_FORMATS[template.page_format]?.width || 210;
  
  let pageHeight = template.page_format === 'Custom'
    ? template.page_height
    : PAGE_FORMATS[template.page_format]?.height || 297;
  
  // Apply orientation (landscape = swap width/height)
  if (template.page_orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  // Get background color from template
  const backgroundColor = template?.background_color || templateConfig?.backgroundColor || '#FFFFFF';

  const fontFaces = buildFontFaces(templateConfig?.customFonts);

  // Use same HTML structure as buildHtml() with mm units and proper CSS
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${fontFaces}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 20px; 
          background: #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .page {
          position: relative;
          width: ${pageWidth}mm;
          height: ${pageHeight}mm;
          background: ${backgroundColor};
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${elementsHtml}
      </div>
    </body>
    </html>
  `;
};

// Render a single element
async function renderElement(element, item, logos, template, useHttpUrls = false, options = {}) {
  // Helper function to generate vertical alignment CSS
  const getVerticalAlignmentStyle = (verticalAlign, textAlign) => {
    if (!verticalAlign) return '';
    
    const alignItems = verticalAlign === 'top' ? 'flex-start' 
      : verticalAlign === 'bottom' ? 'flex-end' 
      : 'center';
    
    const justifyContent = textAlign === 'left' ? 'flex-start' 
      : textAlign === 'right' ? 'flex-end' 
      : 'center';
    
    return `display: flex; align-items: ${alignItems}; justify-content: ${justifyContent};`;
  };
  
  // Elements are stored in mm, use them directly with mm units in CSS
  const baseStyle = `
    position: absolute;
    left: ${element.x || 0}mm;
    top: ${element.y || 0}mm;
    width: ${element.width || 'auto'}mm;
    height: ${element.height || 'auto'}mm;
    opacity: ${element.opacity ?? 1};
    z-index: ${element.zIndex ?? 0};
  `;

  if (element.type === 'text') {
    let content = item[element.csvColumn] || '';
    
    // Apply prefix/suffix if enabled
    if (element.hasTextModifier && element.csvColumn) {
      const prefix = element.textPrefix || '';
      const suffix = element.textSuffix || '';
      const csvValue = item[element.csvColumn] || '';
      content = `${prefix}${csvValue}${suffix}`;
    }
    
    // Determine block background
    const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
    
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 12}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      padding: 4px;
      box-sizing: border-box;
      background-color: ${blockBgColor};
      ${getVerticalAlignmentStyle(element.verticalAlign, element.textAlign)}
      ${element.wordWrap 
        ? 'white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;' 
        : 'white-space: pre;'}
      text-decoration: ${element.textDecoration || 'none'};
    `;
    
    const innerSpanStyle = `text-align: ${element.textAlign || 'left'}; width: 100%;${element.highlightEnabled ? ' background-color: ' + (element.highlightColor || '#FFFF00') + ';' : ''}`;
    
    return `<div style="${textStyle}"><span style="${innerSpanStyle}">${content}</span></div>`;
  }

  if (element.type === 'freeText') {
    const content = element.content || 'Texte libre';
    
    // Determine block background
    const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
    
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 14}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      padding: 4px;
      box-sizing: border-box;
      background-color: ${blockBgColor};
      white-space: pre-wrap;
      ${getVerticalAlignmentStyle(element.verticalAlign, element.textAlign)}
    `;
    
    const innerSpanStyle = `text-align: ${element.textAlign || 'left'}; width: 100%;${element.highlightEnabled ? ' background-color: ' + (element.highlightColor || '#FFFF00') + ';' : ''}`;
    
    return `<div style="${textStyle}"><span style="${innerSpanStyle}">${content}</span></div>`;
  }

  if (element.type === 'jsCode') {
    let result = '';
    try {
      // Execute JavaScript code
      result = await executeJsCode(element.code, item);
    } catch (error) {
      // Error already handled in executeJsCode, use generic message
      result = 'Erreur d\'exécution';
    }
    
    // Determine block background
    const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
    
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 14}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      padding: 4px;
      box-sizing: border-box;
      background-color: ${blockBgColor};
      ${getVerticalAlignmentStyle(element.verticalAlign, element.textAlign)}
    `;
    
    const innerSpanStyle = `text-align: ${element.textAlign || 'left'}; width: 100%;${element.highlightEnabled ? ' background-color: ' + (element.highlightColor || '#FFFF00') + ';' : ''}`;
    
    return `<div style="${textStyle}"><span style="${innerSpanStyle}">${result}</span></div>`;
  }

  if (element.type === 'logo') {
    // Support both logoId and logoPath from element
    let logoPath = element.logoPath;
    
    if (!logoPath && element.logoId) {
      const logo = logos.find(l => l.id === element.logoId);
      logoPath = logo?.path;
    }
    
    if (logoPath) {
      // Convert path to absolute filesystem path
      let absolutePath = logoPath;
      
      // Convert /uploads/ path or relative path to absolute filesystem path
      if (logoPath.startsWith('/uploads/')) {
        // Path is a web URL path, convert to filesystem path
        const cleanPath = logoPath.replace(/^\/uploads\//, '');
        const uploadDir = getUploadDir();
        absolutePath = path.join(uploadDir, cleanPath);
      } else if (!logoPath.startsWith('http') && !path.isAbsolute(logoPath)) {
        // Relative path, make it absolute
        const uploadDir = getUploadDir();
        absolutePath = path.join(uploadDir, logoPath);
      }
      
      // Check if file exists
      if (fs.existsSync(absolutePath)) {
        // Determine block background
        const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
        
        const imageStyle = `
          ${baseStyle}
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${blockBgColor};
        `;
        
        const imgStyle = `
          width: 100%;
          height: 100%;
          object-fit: contain;
        `;
        
        // Use HTTP URL for browser previews, data URL for PDF generation
        let src;
        if (useHttpUrls) {
          // Use the original /uploads/ path for browser
          src = logoPath;
        } else {
          // For PDF generation, convert to base64 data URL to avoid file:// URL issues
          if (absolutePath.startsWith('http')) {
            src = absolutePath;
          } else {
            const dataUrl = imageToDataUrl(absolutePath);
            if (!dataUrl) {
              // Log warning and use a transparent placeholder
              console.warn(`Failed to convert logo to data URL: ${absolutePath}. Logo will not appear in PDF.`);
              // Return empty div instead of fallback to problematic file:// URL
              return `<div style="${baseStyle}"><!-- Logo conversion failed --></div>`;
            }
            src = dataUrl;
          }
        }
        
        return `<div style="${imageStyle}"><img src="${src}" style="${imgStyle}" /></div>`;
      }
    }
    
    return `<div style="${baseStyle}">Logo non trouvé</div>`;
  }

  if (element.type === 'image') {
    // Handle legacy logo format (type: 'image' with source: 'logo')
    if (element.source === 'logo') {
      // Use the first available logo from the logos array
      const logo = logos && logos.length > 0 ? logos[0] : null;
      
      if (logo && logo.path) {
        let absolutePath = logo.path;
        
        // Convert /uploads/ path or relative path to absolute filesystem path
        if (logo.path.startsWith('/uploads/')) {
          // Path is a web URL path, convert to filesystem path
          const cleanPath = logo.path.replace(/^\/uploads\//, '');
          const uploadDir = getUploadDir();
          absolutePath = path.join(uploadDir, cleanPath);
        } else if (!logo.path.startsWith('http') && !path.isAbsolute(logo.path)) {
          // Relative path, make it absolute
          const uploadDir = getUploadDir();
          absolutePath = path.join(uploadDir, logo.path);
        }
        
        // Check if file exists
        if (fs.existsSync(absolutePath)) {
          // Determine block background
          const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
          
          const imageStyle = `
            ${baseStyle}
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${blockBgColor};
          `;
          
          const imgStyle = `
            width: 100%;
            height: 100%;
            object-fit: contain;
          `;
          
          // Use HTTP URL for browser previews, data URL for PDF generation
          let src;
          if (useHttpUrls) {
            // Use the original /uploads/ path for browser
            src = logo.path;
          } else {
            // For PDF generation, convert to base64 data URL to avoid file:// URL issues
            if (absolutePath.startsWith('http')) {
              src = absolutePath;
            } else {
              const dataUrl = imageToDataUrl(absolutePath);
              if (!dataUrl) {
                // Log warning and use a transparent placeholder
                console.warn(`Failed to convert logo to data URL: ${absolutePath}. Logo will not appear in PDF.`);
                // Return empty div instead of fallback to problematic file:// URL
                return `<div style="${baseStyle}"><!-- Logo conversion failed --></div>`;
              }
              src = dataUrl;
            }
          }
          
          return `<div style="${imageStyle}"><img src="${src}" style="${imgStyle}" /></div>`;
        }
      }
      
      return `<div style="${baseStyle}">Logo non trouvé</div>`;
    }
    
    // Handle regular product images
    const imageUrl = await buildProductImageUrl(item, element, options);
    if (imageUrl) {
      let finalSrc = imageUrl;

      // For PDF generation, inline images as data URLs to avoid blocked or relative requests
      if (!useHttpUrls && !imageUrl.startsWith('data:')) {
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          const dataUrl = await fetchRemoteImageAsDataUrl(imageUrl);
          if (dataUrl) {
            finalSrc = dataUrl;
          } else {
            console.warn(`Falling back to remote URL for product image: ${imageUrl}`);
          }
        } else if (imageUrl.startsWith('/uploads/')) {
          const uploadDir = path.resolve(getUploadDir());
          const relativeUploadPath = imageUrl.replace(/^\/uploads\//, '');
          const absolutePath = path.resolve(uploadDir, relativeUploadPath);

          if (!absolutePath.startsWith(uploadDir)) {
            console.warn(`Blocked suspicious upload path for inlining: ${imageUrl}`);
            return '';
          } else {
            // imageToDataUrl performs synchronous disk reads; acceptable here during PDF generation
            const dataUrl = imageToDataUrl(absolutePath);
            if (dataUrl) {
              finalSrc = dataUrl;
            } else {
              console.warn(`Failed to inline local product image: ${absolutePath}`);
            }
          }
        }
      }

      // Determine block background
      const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
      const imgStyle = `${baseStyle} object-fit: ${element.fit || 'contain'}; background-color: ${blockBgColor};`;
      return `<img src="${finalSrc}" alt="Product" style="${imgStyle}" onerror="this.style.display='none'" />`;
    }
    // Return empty string if no valid image URL could be built (e.g., missing CSV column data)
    return '';
  }

  if (element.type === 'line') {
    // Determine block background
    const blockBgColor = element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'transparent');
    
    const lineStyle = `
      ${baseStyle}
      border-bottom: ${element.thickness || 1}px ${element.style || 'solid'} ${element.color || '#000000'};
      background-color: ${blockBgColor};
    `;
    return `<div style="${lineStyle}"></div>`;
  }

  if (element.type === 'rectangle') {
    // For rectangle, blockBackgroundColor takes precedence over backgroundColor if set
    let finalBgColor = element.backgroundColor || 'transparent';
    if (!element.blockBackgroundTransparent && element.blockBackgroundColor) {
      finalBgColor = element.blockBackgroundColor;
    } else if (element.blockBackgroundTransparent) {
      finalBgColor = 'transparent';
    }
    
    const rectStyle = `
      ${baseStyle}
      background-color: ${finalBgColor};
      border: ${element.borderWidth || 1}px ${element.borderStyle || 'solid'} ${element.borderColor || '#000000'};
      border-radius: ${element.borderRadius || 0}px;
    `;
    return `<div style="${rectStyle}"></div>`;
  }

  return '';
}

// Execute JavaScript code with timeout
async function executeJsCode(code, data) {
  if (!code) return '';
  
  try {
    // Create async function from code
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('data', code);
    
    // Execute with timeout (5 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Le code a pris plus de 5 secondes')), 5000)
    );
    
    const result = await Promise.race([
      fn(data || {}),
      timeoutPromise
    ]);
    
    // Validate and sanitize result
    if (result === null || result === undefined) {
      return '';
    }
    
    // Convert to string safely
    const stringResult = String(result);
    
    // Limit length to prevent excessive output
    if (stringResult.length > 1000) {
      return stringResult.substring(0, 1000) + '...';
    }
    
    return stringResult;
  } catch (error) {
    console.error('JS code execution error:', error);
    // Return generic error message to avoid exposing system information
    return 'Erreur d\'exécution du code JavaScript';
  }
}

// Fetch product image URL (scraping or default source)
async function fetchProductImageUrl(reference, options = {}) {
  if (!reference) return null;

  if (DEBUG_IMAGE_SCRAPING) {
    console.log('🔍 [Image Scraper Debug] Starting image fetch for reference:', reference);
    console.log('📋 [Image Scraper Debug] Options:', {
      pageUrlTemplate: options.pageUrlTemplate,
      imageSelector: options.imageSelector,
      imageAttribute: options.imageAttribute,
      urlEncodeValue: options.urlEncodeValue,
      csvColumn: options.csvColumn,
      baseUrl: options.baseUrl,
      extension: options.extension,
      elementId: options.elementId
    });
  }

  const cacheKey = buildImageCacheKey(reference, options);
  const cached = productImageCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < PRODUCT_IMAGE_CACHE_TTL_MS) {
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('💾 [Image Scraper Debug] Returning cached URL:', cached.url);
    }
    return cached.url;
  }

  const shouldEncode = shouldUrlEncodeValue(options.urlEncodeValue);
  const pageUrlFromTemplate = options.pageUrlTemplate
    ? applyValueToTemplate(options.pageUrlTemplate, reference, shouldEncode, options.csvColumn)
    : null;

  if (DEBUG_IMAGE_SCRAPING) {
    console.log('🔗 [Image Scraper Debug] Constructed page URL:', pageUrlFromTemplate);
  }

  // 1) Direct URL templating (when no selector is provided)
  if (pageUrlFromTemplate && (!options.imageSelector || !options.imageSelector.trim())) {
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('✅ [Image Scraper Debug] Direct URL mode (no selector) - returning URL as-is');
    }
    productImageCache.set(cacheKey, { url: pageUrlFromTemplate, timestamp: now });
    return pageUrlFromTemplate;
  }

  // 2) Custom scraping based on template + selector
  if (options.pageUrlTemplate && options.imageSelector && options.imageSelector.trim()) {
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('🕷️ [Image Scraper Debug] Scraping mode - fetching page and looking for selector:', options.imageSelector);
    }
    const pageUrl = pageUrlFromTemplate;
    if (pageUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        if (DEBUG_IMAGE_SCRAPING) {
          console.log('📡 [Image Scraper Debug] Fetching page:', pageUrl);
        }
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': DEFAULT_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          redirect: 'follow',
          signal: controller.signal
        });

        if (DEBUG_IMAGE_SCRAPING) {
          console.log('📥 [Image Scraper Debug] Page fetch response status:', response.status);
        }

        if (response.ok) {
          const html = await response.text();
          if (DEBUG_IMAGE_SCRAPING) {
            console.log('📄 [Image Scraper Debug] Page HTML length:', html.length, 'characters');
          }
          
          const $ = cheerio.load(html);
          const node = $(options.imageSelector).first();
          if (DEBUG_IMAGE_SCRAPING) {
            console.log('🎯 [Image Scraper Debug] Found node with selector?', node.length > 0);
          }
          
          const imageAttribute = options.imageAttribute || 'src';
          let src = node.attr(imageAttribute);
          if (DEBUG_IMAGE_SCRAPING) {
            console.log(`🖼️ [Image Scraper Debug] Image attribute '${imageAttribute}' value:`, src);
          }
          
          // If the preferred attribute is missing, gracefully fallback to classic src
          if (!src && imageAttribute !== 'src') {
            src = node.attr('src');
            if (DEBUG_IMAGE_SCRAPING) {
              console.log('🔄 [Image Scraper Debug] Fallback to src attribute:', src);
            }
          }
          
          const normalized = normalizeImageUrl(src, pageUrl);
          if (DEBUG_IMAGE_SCRAPING) {
            console.log('🔗 [Image Scraper Debug] Normalized image URL:', normalized);
          }
          
          productImageCache.set(cacheKey, { url: normalized, timestamp: now });
          if (normalized) {
            if (DEBUG_IMAGE_SCRAPING) {
              console.log('✅ [Image Scraper Debug] Successfully scraped image URL:', normalized, 'for reference:', reference);
            }
            return normalized;
          } else {
            if (DEBUG_IMAGE_SCRAPING) {
              console.warn('⚠️ [Image Scraper Debug] Failed to normalize image URL for reference:', reference);
            }
          }
        } else {
          if (DEBUG_IMAGE_SCRAPING) {
            console.warn(`❌ [Image Scraper Debug] Failed to fetch product page (${response.status}): ${pageUrl}`);
          }
        }
      } catch (error) {
        if (DEBUG_IMAGE_SCRAPING) {
          console.error(`❌ [Image Scraper Debug] Error fetching product image for ${reference}:`, error.message);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // 3) Default legacy scraping (placedespros)
  if (DEBUG_IMAGE_SCRAPING) {
    console.log('🔄 [Image Scraper Debug] Falling back to legacy placedespros scraping');
  }
  const productUrl = `https://www.placedespros.com/article/art-${encodeURIComponent(reference)}`;
  if (DEBUG_IMAGE_SCRAPING) {
    console.log('🔗 [Image Scraper Debug] Legacy product URL:', productUrl);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('📡 [Image Scraper Debug] Fetching legacy page');
    }
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      if (DEBUG_IMAGE_SCRAPING) {
        console.warn(`❌ [Image Scraper Debug] Failed to fetch product page (${response.status}): ${productUrl}`);
      }
      productImageCache.set(cacheKey, { url: null, timestamp: now });
      return null;
    }

    const html = await response.text();
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('📄 [Image Scraper Debug] Legacy page HTML length:', html.length, 'characters');
    }
    
    // Look for the main product image with class "photoItem"
    const imgRegex = /<img[^>]*class=["'][^"']*photoItem[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i;
    const match = html.match(imgRegex);
    
    if (DEBUG_IMAGE_SCRAPING) {
      console.log('🎯 [Image Scraper Debug] photoItem image found?', !!match);
    }

    if (match && match[1]) {
      const normalized = normalizeImageUrl(match[1], productUrl);
      if (DEBUG_IMAGE_SCRAPING) {
        console.log('✅ [Image Scraper Debug] Legacy scraping successful. Image URL:', normalized, 'for reference:', reference);
      }
      productImageCache.set(cacheKey, { url: normalized, timestamp: now });
      return normalized;
    }

    if (DEBUG_IMAGE_SCRAPING) {
      console.warn(`⚠️ [Image Scraper Debug] No product image found for reference ${reference}`);
    }
    productImageCache.set(cacheKey, { url: null, timestamp: now });
    return null;
  } catch (error) {
    if (DEBUG_IMAGE_SCRAPING) {
      console.error(`❌ [Image Scraper Debug] Error fetching product image for ${reference}:`, error.message);
    }
    productImageCache.set(cacheKey, { url: null, timestamp: now });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Build product image URL
async function buildProductImageUrl(item, element, options = {}) {
  if (!element.csvColumn) return null;
  
  const csvValue = item[element.csvColumn];
  if (csvValue === undefined || csvValue === null) return null;

  let value = csvValue;

  if (typeof csvValue === 'string') {
    const trimmedValue = csvValue.trim();
    if (!trimmedValue) return null;

    // Check if CSV value is already a complete URL (http/https/data)
    // Don't use baseUrl for this check - it's a fallback, not a normalization base
    if (isRenderableUrl(trimmedValue)) {
      return trimmedValue;
    }

    value = trimmedValue;
  }

  // Preferred: fetch online image via scraping (pageUrlTemplate + imageSelector)
  const onlineUrl = await fetchProductImageUrl(value, {
    pageUrlTemplate: element.pageUrlTemplate,
    imageSelector: element.imageSelector,
    imageAttribute: element.imageAttribute,
    urlEncodeValue: shouldUrlEncodeValue(element.urlEncodeValue),
    csvColumn: element.csvColumn,
    baseUrl: element.baseUrl || options.productImageBaseUrl,
    extension: element.extension,
    elementId: element.id // Pass element ID to prevent cache sharing between blocks
  });
  if (onlineUrl) return onlineUrl;

  // Fallback to legacy base URL + extension if configured
  if (element.baseUrl) {
    return `${element.baseUrl}${value}${element.extension || ''}`;
  }

  if (options.productImageBaseUrl) {
    return `${options.productImageBaseUrl}${value}${element.extension || ''}`;
  }

  return null;
}

// Build HTML from template and data
const buildHtml = async (items, template, logo, allLogos, mappings, visibleFields, options = {}) => {
  const templateConfig = template ? JSON.parse(template.config) : null;
  
  // Get background color from template config or template column
  const backgroundColor = template?.background_color || templateConfig?.backgroundColor || '#FFFFFF';
  
  // Default template if none provided
  const defaultHtml = items.map(item => {
    const fields = visibleFields || Object.keys(item);
    
    // Convert logo to data URL for PDF rendering
    let logoHtml = '';
    if (logo && logo.path) {
      let absoluteLogoPath = logo.path;
      
      // Convert to absolute path if needed
      if (logo.path.startsWith('/uploads/')) {
        const cleanPath = logo.path.replace(/^\/uploads\//, '');
        const uploadDir = getUploadDir();
        absoluteLogoPath = path.join(uploadDir, cleanPath);
      } else if (!logo.path.startsWith('http') && !path.isAbsolute(logo.path)) {
        const uploadDir = getUploadDir();
        absoluteLogoPath = path.join(uploadDir, logo.path);
      }
      
      // Use data URL for PDF generation
      let logoSrc;
      if (absoluteLogoPath.startsWith('http')) {
        logoSrc = absoluteLogoPath;
      } else {
        const dataUrl = imageToDataUrl(absoluteLogoPath);
        if (!dataUrl) {
          // Log warning if conversion fails
          console.warn(`Failed to convert logo to data URL: ${absoluteLogoPath}. Logo will not appear in PDF.`);
          logoSrc = null; // Don't render logo if conversion fails
        } else {
          logoSrc = dataUrl;
        }
      }
      
      if (logoSrc) {
        logoHtml = `<img src="${logoSrc}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;" />`;
      }
    }
    
    return `
      <div class="product-card" style="page-break-after: always; padding: 20px; font-family: Arial, sans-serif; background-color: ${backgroundColor};">
        ${logoHtml}
        ${fields.map(field => `
          <div style="margin-bottom: 10px;">
            <strong>${field}:</strong> ${item[field] || ''}
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  // If template config exists, use it to build custom HTML
  let customHtml = '';
  if (templateConfig && templateConfig.elements) {
    // Use all logos for rendering, fallback to single logo if provided
    const logos = allLogos && allLogos.length > 0 ? allLogos : (logo ? [logo] : []);
    
    const pagePromises = items.map(async (item, index) => {
      const elementPromises = templateConfig.elements.map(element => {
        return renderElement(element, item, logos, template, false, options);
      });
      
      const elements = await Promise.all(elementPromises);
      const elementsHtml = elements.join('');

      // Get page dimensions exactly as in generatePreviewHtml()
      let pageWidth = template.page_format === 'Custom' 
        ? template.page_width 
        : PAGE_FORMATS[template.page_format]?.width || 210;
      
      let pageHeight = template.page_format === 'Custom'
        ? template.page_height
        : PAGE_FORMATS[template.page_format]?.height || 297;
      
      // Apply orientation (landscape = swap width/height)
      if (template.page_orientation === 'landscape') {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
      }

      // Add page break after each page except the last one
      const pageBreak = index < items.length - 1 ? 'page-break-after: always;' : '';

      return `
        <div class="product-card" style="position: relative; width: ${pageWidth}mm; height: ${pageHeight}mm; background-color: ${backgroundColor}; ${pageBreak}">
          ${elementsHtml}
        </div>
      `;
    });
    
    const pages = await Promise.all(pagePromises);
    customHtml = pages.join('');
  }

  const fontFaces = buildFontFaces(templateConfig?.customFonts);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${fontFaces}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        .product-card:last-child { page-break-after: auto; }
        @media print {
          .product-card { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${customHtml || defaultHtml}
    </body>
    </html>
  `;

  return html;
};

// Generate PDF
exports.generatePdf = async (params) => {
  const { items, template, logo, allLogos, mappings, visibleFields, options } = params;

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Forward browser console messages to server console
    page.on('console', async (msg) => {
      const type = msg.type();
      const text = msg.text();
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
      
      // Format the message with args if available
      const message = args.length > 0 ? args.join(' ') : text;
      
      // Forward to server console with appropriate level
      if (type === 'error') {
        console.error(`[Browser Console] ${message}`);
      } else if (type === 'warning') {
        console.warn(`[Browser Console] ${message}`);
      } else if (type === 'log' || type === 'info') {
        console.log(`[Browser Console] ${message}`);
      } else if (type === 'debug') {
        console.debug(`[Browser Console] ${message}`);
      }
    });

    // Get product image base URL from settings
    let productImageBaseUrl = options?.productImageBaseUrl;
    if (!productImageBaseUrl) {
      const settings = await dbGet('SELECT value FROM settings WHERE key = ?', ['product_image_base_url']);
      productImageBaseUrl = settings?.value;
    }
    // Fallback to environment variable if no DB setting is found
    if (!productImageBaseUrl && process.env.PRODUCT_IMAGE_BASE_URL) {
      productImageBaseUrl = process.env.PRODUCT_IMAGE_BASE_URL;
    }

    // Build HTML
    const html = await buildHtml(items, template, logo, allLogos, mappings || [], visibleFields, { productImageBaseUrl });

    // Set content
    await page.setDefaultNavigationTimeout(PDF_NAVIGATION_TIMEOUT_MS);
    await page.setDefaultTimeout(PDF_NAVIGATION_TIMEOUT_MS);

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: PDF_NAVIGATION_TIMEOUT_MS });

    // Wait for network to become idle but don't block indefinitely
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: PDF_RESOURCE_WAIT_TIMEOUT_MS }).catch(() => {
      console.warn(`PDF generation: network idle wait timed out after ${PDF_RESOURCE_WAIT_TIMEOUT_MS}ms, continuing rendering.`);
    });

    // Attach lightweight error tracking to detect broken images and log to browser console
    await page.evaluate(() => {
      console.log('🖼️ [PDF Image Debug] Starting image load tracking...');
      const images = document.querySelectorAll('img');
      console.log(`🖼️ [PDF Image Debug] Found ${images.length} images to load`);
      
      images.forEach((img, index) => {
        if (img.dataset.pdfErrorListenerAttached) return;
        img.dataset.pdfErrorListenerAttached = '1';
        
        const imgSrc = img.src;
        const isDataUrl = imgSrc.startsWith('data:');
        const srcPreview = isDataUrl ? `data:${imgSrc.substring(5, 30)}...` : imgSrc;
        
        img.addEventListener('load', () => {
          console.log(`✅ [PDF Image Debug] Image ${index + 1}/${images.length} loaded successfully:`, srcPreview);
          console.log(`   - Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
        }, { once: true });
        
        img.addEventListener('error', () => {
          console.error(`❌ [PDF Image Debug] Image ${index + 1}/${images.length} failed to load:`, srcPreview);
          img.dataset.loadError = '1';
        }, { once: true });
        
        // Log initial state
        if (img.complete) {
          if (img.naturalWidth > 0) {
            console.log(`✅ [PDF Image Debug] Image ${index + 1}/${images.length} already loaded:`, srcPreview);
          } else {
            console.error(`❌ [PDF Image Debug] Image ${index + 1}/${images.length} already failed:`, srcPreview);
            img.dataset.loadError = '1';
          }
        } else {
          console.log(`⏳ [PDF Image Debug] Image ${index + 1}/${images.length} loading...`, srcPreview);
        }
      });
    });

    // Ensure images finished loading (or timeout)
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img');
      
      // Count statuses in a single iteration
      let loadedCount = 0;
      let failedCount = 0;
      for (const img of images) {
        if (img.dataset.loadError === '1') {
          failedCount++;
        } else if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          loadedCount++;
        }
      }
      const pendingCount = images.length - loadedCount - failedCount;
      
      console.log(`📊 [PDF Image Debug] Image loading status: ${loadedCount} loaded, ${failedCount} failed, ${pendingCount} pending (total: ${images.length})`);
      
      const allDone = images.length === 0 || (failedCount === 0 && pendingCount === 0);
      if (allDone) {
        console.log('✅ [PDF Image Debug] All images loaded successfully!');
      }
      return allDone;
    }, { timeout: PDF_RESOURCE_WAIT_TIMEOUT_MS, polling: 500 }).catch(() => {
      console.warn(`PDF generation: image load wait timed out after ${PDF_RESOURCE_WAIT_TIMEOUT_MS}ms, proceeding with available content.`);
    });

    // Configure page format based on template
    const pageConfig = {
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    if (template) {
      const format = template.page_format || 'A4';
      const orientation = template.page_orientation || 'portrait';

      if (format === 'Custom' && template.page_width && template.page_height) {
        pageConfig.width = `${template.page_width}mm`;
        pageConfig.height = `${template.page_height}mm`;
      } else {
        pageConfig.format = format;
      }

      pageConfig.landscape = orientation === 'landscape';
    } else {
      pageConfig.format = 'A4';
      pageConfig.landscape = false;
    }

    // Generate PDF
    const pdfBuffer = await page.pdf(pageConfig);

    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Expose product image fetcher for controllers
exports.fetchProductImageUrl = fetchProductImageUrl;
