const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { dbGet } = require('../config/database');

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

// Page format definitions
const PAGE_FORMATS = {
  'A4': { width: 210, height: 297 }, // mm
  'A5': { width: 148, height: 210 },
  'Letter': { width: 215.9, height: 279.4 },
  'Custom': { width: null, height: null } // defined by user
};

// Generate preview HTML for a single item
exports.generatePreviewHtml = async ({ item, template, logos }) => {
  const templateConfig = template ? JSON.parse(template.config) : null;
  
  if (!templateConfig || !templateConfig.elements) {
    return '<div style="padding: 20px;">Aucun élément dans le template</div>';
  }

  const elementPromises = templateConfig.elements.map(element => {
    return renderElement(element, item, logos, template);
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

  // Use same HTML structure as buildHtml() with mm units and proper CSS
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
async function renderElement(element, item, logos, template) {
  const baseStyle = `
    position: absolute;
    left: ${element.x || 0}px;
    top: ${element.y || 0}px;
    width: ${element.width || 'auto'}px;
    height: ${element.height || 'auto'}px;
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
    
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 12}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      text-align: ${element.textAlign || 'left'};
      ${element.wordWrap ? 'word-wrap: break-word; overflow-wrap: break-word;' : 'white-space: nowrap;'}
      text-decoration: ${element.textDecoration || 'none'};
    `;
    return `<div style="${textStyle}">${content}</div>`;
  }

  if (element.type === 'freeText') {
    const content = element.content || 'Texte libre';
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 14}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      text-align: ${element.textAlign || 'left'};
      white-space: pre-wrap;
    `;
    return `<div style="${textStyle}">${content}</div>`;
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
    
    const textStyle = `
      ${baseStyle}
      font-size: ${element.fontSize || 14}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      color: ${element.color || '#000000'};
      text-align: ${element.textAlign || 'left'};
    `;
    return `<div style="${textStyle}">${result}</div>`;
  }

  if (element.type === 'logo') {
    // Support both logoId and logoPath from element
    let logoPath = element.logoPath;
    
    if (!logoPath && element.logoId) {
      const logo = logos.find(l => l.id === element.logoId);
      logoPath = logo?.path;
    }
    
    if (logoPath) {
      // Convert relative path to absolute filesystem path
      let absolutePath = logoPath;
      
      if (!logoPath.startsWith('http') && !path.isAbsolute(logoPath)) {
        // Remove leading /uploads if present
        const cleanPath = logoPath.replace(/^\/uploads\//, '');
        // Use configurable upload directory
        const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
        absolutePath = path.join(uploadDir, cleanPath);
      }
      
      // Check if file exists
      if (fs.existsSync(absolutePath)) {
        const imageStyle = `
          ${baseStyle}
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        
        const imgStyle = `
          width: 100%;
          height: 100%;
          object-fit: contain;
        `;
        
        // Use file:// protocol for local files
        const src = absolutePath.startsWith('http') 
          ? absolutePath 
          : `file://${absolutePath}`;
        
        return `<div style="${imageStyle}"><img src="${src}" style="${imgStyle}" /></div>`;
      }
    }
    
    return `<div style="${baseStyle}">Logo non trouvé</div>`;
  }

  if (element.type === 'image') {
    const imageUrl = buildProductImageUrl(item, element);
    if (imageUrl) {
      const imgStyle = `${baseStyle} object-fit: ${element.fit || 'contain'};`;
      return `<img src="${imageUrl}" alt="Product" style="${imgStyle}" onerror="this.style.display='none'" />`;
    }
    return '';
  }

  if (element.type === 'line') {
    const lineStyle = `
      ${baseStyle}
      border-bottom: ${element.thickness || 1}px ${element.style || 'solid'} ${element.color || '#000000'};
    `;
    return `<div style="${lineStyle}"></div>`;
  }

  if (element.type === 'rectangle') {
    const rectStyle = `
      ${baseStyle}
      background-color: ${element.backgroundColor || 'transparent'};
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

// Build product image URL
function buildProductImageUrl(item, element) {
  if (!element.baseUrl || !element.csvColumn) return null;
  
  const value = item[element.csvColumn];
  if (!value) return null;

  return `${element.baseUrl}${value}${element.extension || ''}`;
}

// Build HTML from template and data
const buildHtml = async (items, template, logo, allLogos, mappings, visibleFields, options = {}) => {
  const templateConfig = template ? JSON.parse(template.config) : null;
  
  // Get background color from template config or template column
  const backgroundColor = template?.background_color || templateConfig?.backgroundColor || '#FFFFFF';
  
  // Default template if none provided
  const defaultHtml = items.map(item => {
    const fields = visibleFields || Object.keys(item);
    
    return `
      <div class="product-card" style="page-break-after: always; padding: 20px; font-family: Arial, sans-serif; background-color: ${backgroundColor};">
        ${logo ? `<img src="file://${path.resolve(logo.path)}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;" />` : ''}
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
        return renderElement(element, item, logos, template);
      });
      
      const elements = await Promise.all(elementPromises);
      const elementsHtml = elements.join('');

      const pageWidth = template.page_format === 'Custom' ? template.page_width : PAGE_FORMATS[template.page_format]?.width || 210;
      const pageHeight = template.page_format === 'Custom' ? template.page_height : PAGE_FORMATS[template.page_format]?.height || 297;

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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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

    // Get product image base URL from settings
    let productImageBaseUrl = options?.productImageBaseUrl;
    if (!productImageBaseUrl) {
      const settings = await dbGet('SELECT value FROM settings WHERE key = ?', ['product_image_base_url']);
      productImageBaseUrl = settings?.value;
    }

    // Build HTML
    const html = await buildHtml(items, template, logo, allLogos, mappings || [], visibleFields, { productImageBaseUrl });

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

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
