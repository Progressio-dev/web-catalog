/**
 * Template Schema Migrations
 * 
 * This file handles automatic migration of template configurations
 * to ensure backward compatibility when schema changes.
 */

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Migrate a template config to the current schema version
 * @param {Object} config - The template configuration
 * @param {Object} templateMeta - Template metadata (page_format, page_orientation, etc.)
 * @returns {Object} - Migrated configuration
 */
export function migrateTemplateConfig(config, templateMeta = {}) {
  if (!config) return null;

  const version = config.schemaVersion || 1;
  
  if (version >= CURRENT_SCHEMA_VERSION) {
    return config;
  }

  let migratedConfig = { ...config };

  // Apply migrations in sequence
  if (version < 2) {
    migratedConfig = migrateV1ToV2(migratedConfig, templateMeta);
  }

  // Future migrations will be added here
  // if (version < 3) {
  //   migratedConfig = migrateV2ToV3(migratedConfig);
  // }

  migratedConfig.schemaVersion = CURRENT_SCHEMA_VERSION;
  return migratedConfig;
}

/**
 * Migration from version 1 to version 2
 * - Adds schemaVersion field
 * - Ensures mmMigrated flag is set
 * - Converts px to mm if needed
 * - Adds support for groups, grid settings, and tables
 */
function migrateV1ToV2(config, templateMeta) {
  const PAGE_FORMATS = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 },
  };

  const MM_TO_PX = 3.779528;

  // Get page dimensions
  const pageFormat = templateMeta.page_format || 'A4';
  const orientation = templateMeta.page_orientation || 'portrait';
  const customWidth = templateMeta.page_width;
  const customHeight = templateMeta.page_height;

  let pageWidth = pageFormat === 'Custom' 
    ? customWidth 
    : PAGE_FORMATS[pageFormat]?.width || 210;
  let pageHeight = pageFormat === 'Custom'
    ? customHeight
    : PAGE_FORMATS[pageFormat]?.height || 297;

  if (orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }

  // Migrate elements if needed
  const elements = config.elements || [];
  const alreadyMigrated = config.mmMigrated === true;

  const migratedElements = elements.map(element => {
    if (alreadyMigrated) return element;

    // Check if values look like they're in px
    const widthLooksLikePx = (element.width || 0) > pageWidth;
    const heightLooksLikePx = (element.height || 0) > pageHeight;
    const xLooksLikePx = (element.x || 0) > pageWidth;
    const yLooksLikePx = (element.y || 0) > pageHeight;
    
    const needsMigration = widthLooksLikePx || heightLooksLikePx || xLooksLikePx || yLooksLikePx;
    
    if (needsMigration) {
      return {
        ...element,
        x: (element.x || 0) / MM_TO_PX,
        y: (element.y || 0) / MM_TO_PX,
        width: (element.width || 0) / MM_TO_PX,
        height: (element.height || 0) / MM_TO_PX,
      };
    }
    return element;
  });

  return {
    ...config,
    elements: migratedElements,
    mmMigrated: true,
    schemaVersion: 2,
    // Add new v2 features with defaults
    gridSettings: config.gridSettings || {
      enabled: false,
      size: 10, // mm
      snapToGrid: false,
      showSmartGuides: true,
    },
  };
}

/**
 * Validate that a template config has the required structure
 * @param {Object} config - The configuration to validate
 * @returns {boolean} - True if valid
 */
export function validateTemplateConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Required fields
  if (!Array.isArray(config.elements)) {
    return false;
  }

  // Validate each element has required properties
  for (const element of config.elements) {
    if (!element.type || !element.id) {
      return false;
    }
    if (typeof element.x !== 'number' || typeof element.y !== 'number') {
      return false;
    }
    if (typeof element.width !== 'number' || typeof element.height !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Get the current schema version
 * @returns {number}
 */
export function getCurrentSchemaVersion() {
  return CURRENT_SCHEMA_VERSION;
}

/**
 * Check if a group element is valid
 * @param {Object} element - The element to check
 * @returns {boolean}
 */
export function isValidGroup(element) {
  return (
    element.type === 'group' &&
    Array.isArray(element.children) &&
    element.children.length > 0
  );
}

/**
 * Check if a table element is valid
 * @param {Object} element - The element to check
 * @returns {boolean}
 */
export function isValidTable(element) {
  return (
    element.type === 'table' &&
    Array.isArray(element.columns) &&
    element.columns.length > 0
  );
}
