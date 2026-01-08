const puppeteer = require('puppeteer');
const path = require('path');
const { dbGet } = require('../config/database');

// Build HTML from template and data
const buildHtml = (items, template, logo, mappings, visibleFields, options = {}) => {
  const templateConfig = template ? JSON.parse(template.config) : null;
  
  // Default template if none provided
  const defaultHtml = items.map(item => {
    const fields = visibleFields || Object.keys(item);
    
    return `
      <div class="product-card" style="page-break-after: always; padding: 20px; font-family: Arial, sans-serif;">
        ${logo ? `<img src="${logo.path}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;" />` : ''}
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
    customHtml = items.map(item => {
      const elements = templateConfig.elements.map(element => {
        const style = `
          position: absolute;
          left: ${element.x || 0}px;
          top: ${element.y || 0}px;
          width: ${element.width || 'auto'};
          height: ${element.height || 'auto'};
          font-size: ${element.fontSize || 12}px;
          font-weight: ${element.fontWeight || 'normal'};
          font-style: ${element.fontStyle || 'normal'};
          color: ${element.color || '#000'};
          background: ${element.background || 'transparent'};
          border: ${element.border || 'none'};
        `;

        // Map CSV field to element
        let content = element.content || '';
        if (element.type === 'text' && element.field) {
          const mapping = mappings.find(m => m.pdf_zone === element.id);
          if (mapping && item[mapping.csv_field]) {
            content = item[mapping.csv_field];
          }
        } else if (element.type === 'image') {
          if (element.source === 'logo' && logo) {
            return `<img src="${logo.path}" alt="Logo" style="${style}" />`;
          } else if (element.source === 'product') {
            // Build product image URL
            const imageUrl = buildProductImageUrl(item, options.productImageBaseUrl);
            if (imageUrl) {
              return `<img src="${imageUrl}" alt="Product" style="${style}" />`;
            }
          }
        }

        return `<div style="${style}">${content}</div>`;
      }).join('');

      return `
        <div class="product-card" style="page-break-after: always; position: relative; width: 210mm; height: 297mm;">
          ${elements}
        </div>
      `;
    }).join('');
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
      </style>
    </head>
    <body>
      ${customHtml || defaultHtml}
    </body>
    </html>
  `;

  return html;
};

// Build product image URL
const buildProductImageUrl = (item, baseUrl) => {
  if (!baseUrl) return null;
  
  // Try to find reference field
  const referenceField = item.reference || item.Reference || item.ref || item.sku || item.SKU;
  if (!referenceField) return null;

  return `${baseUrl}${referenceField}.jpg`;
};

// Generate PDF
exports.generatePdf = async (params) => {
  const { items, template, logo, mappings, visibleFields, options } = params;

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
    const html = buildHtml(items, template, logo, mappings || [], visibleFields, { productImageBaseUrl });

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

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
