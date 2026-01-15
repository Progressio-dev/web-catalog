/**
 * Get default border radius based on image mask type
 * @param {string} imageMask - The mask type ('circle', 'rounded', 'rounded-lg', 'none')
 * @returns {number} Default border radius in pixels
 */
export const getDefaultBorderRadius = (imageMask) => {
  if (imageMask === 'rounded') return 10;
  if (imageMask === 'rounded-lg') return 20;
  return 0;
};

/**
 * Calculate border radius style string based on element properties
 * @param {Object} element - The element with imageMask and borderRadius properties
 * @param {number} zoom - Optional zoom factor for preview (default: 1)
 * @returns {string} CSS border-radius value
 */
export const calculateBorderRadius = (element, zoom = 1) => {
  const imageMask = element.imageMask || 'none';
  
  if (imageMask === 'circle') {
    return '50%';
  }
  
  if (imageMask === 'rounded' || imageMask === 'rounded-lg') {
    const radius = element.borderRadius ?? getDefaultBorderRadius(imageMask);
    return `${radius * zoom}px`;
  }
  
  return '0px';
};
