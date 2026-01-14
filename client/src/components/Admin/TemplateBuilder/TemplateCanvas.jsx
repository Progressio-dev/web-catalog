import React from 'react';

const PAGE_FORMATS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
};

const TemplateCanvas = ({
  pageConfig,
  elements,
  selectedElement,
  selectedElements = [],
  gridSettings = { enabled: false, size: 10, snapToGrid: false, showSmartGuides: true },
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [resizingId, setResizingId] = React.useState(null);
  const [resizeHandle, setResizeHandle] = React.useState(null);
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
  const [mouseDownPos, setMouseDownPos] = React.useState(null);
  const [smartGuides, setSmartGuides] = React.useState({ horizontal: [], vertical: [] });

  // Get base page dimensions in mm
  let pageWidth =
    pageConfig.format === 'Custom'
      ? pageConfig.width
      : PAGE_FORMATS[pageConfig.format]?.width || 210;
  let pageHeight =
    pageConfig.format === 'Custom'
      ? pageConfig.height
      : PAGE_FORMATS[pageConfig.format]?.height || 297;

  // Apply orientation (landscape = swap width/height)
  if (pageConfig.orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }

  // Convert mm to pixels for rendering (96 DPI standard)
  // At 96 DPI: 1 inch = 96px, 1 inch = 25.4mm → 1mm = 96/25.4 ≈ 3.779528px
  const MM_TO_PX = 3.779528;
  const MIN_ELEMENT_SIZE_MM = 8; // Minimum element size in mm (~30px at 96 DPI)
  const MIN_EDGE_MARGIN_MM = 20; // Minimum margin from page edge in mm
  const canvasWidth = pageWidth * MM_TO_PX;
  const canvasHeight = pageHeight * MM_TO_PX;

  // Handle delete key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElement) {
        onDeleteElement(selectedElement.id);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onDeleteElement]);

  // Snap value to grid
  const snapToGrid = (value) => {
    if (!gridSettings.snapToGrid || !gridSettings.enabled) {
      return value;
    }
    const gridSizeMm = gridSettings.size;
    return Math.round(value / gridSizeMm) * gridSizeMm;
  };

  // Calculate smart guides for alignment
  const calculateSmartGuides = (currentElement, x, y, width, height) => {
    if (!gridSettings.showSmartGuides) {
      setSmartGuides({ horizontal: [], vertical: [] });
      return;
    }

    const SNAP_THRESHOLD_MM = 2; // 2mm threshold for snapping
    const horizontal = [];
    const vertical = [];

    // Check alignment with other elements
    elements.forEach(el => {
      if (el.id === currentElement.id) return;
      
      // Skip children if we're dragging a group
      if (currentElement.type === 'group' && 
          currentElement.children?.some(child => child.id === el.id)) {
        return;
      }

      // Vertical guides (X alignment)
      // Left edges
      if (Math.abs(x - el.x) < SNAP_THRESHOLD_MM) {
        vertical.push({ position: el.x, type: 'left' });
      }
      // Right edges
      if (Math.abs((x + width) - (el.x + el.width)) < SNAP_THRESHOLD_MM) {
        vertical.push({ position: el.x + el.width, type: 'right' });
      }
      // Centers
      const currentCenterX = x + width / 2;
      const elCenterX = el.x + el.width / 2;
      if (Math.abs(currentCenterX - elCenterX) < SNAP_THRESHOLD_MM) {
        vertical.push({ position: elCenterX, type: 'center' });
      }

      // Horizontal guides (Y alignment)
      // Top edges
      if (Math.abs(y - el.y) < SNAP_THRESHOLD_MM) {
        horizontal.push({ position: el.y, type: 'top' });
      }
      // Bottom edges
      if (Math.abs((y + height) - (el.y + el.height)) < SNAP_THRESHOLD_MM) {
        horizontal.push({ position: el.y + el.height, type: 'bottom' });
      }
      // Centers
      const currentCenterY = y + height / 2;
      const elCenterY = el.y + el.height / 2;
      if (Math.abs(currentCenterY - elCenterY) < SNAP_THRESHOLD_MM) {
        horizontal.push({ position: elCenterY, type: 'center' });
      }
    });

    // Page center guides
    const pageCenterX = pageWidth / 2;
    const pageCenterY = pageHeight / 2;
    const currentCenterX = x + width / 2;
    const currentCenterY = y + height / 2;

    if (Math.abs(currentCenterX - pageCenterX) < SNAP_THRESHOLD_MM) {
      vertical.push({ position: pageCenterX, type: 'page-center' });
    }
    if (Math.abs(currentCenterY - pageCenterY) < SNAP_THRESHOLD_MM) {
      horizontal.push({ position: pageCenterY, type: 'page-center' });
    }

    setSmartGuides({ horizontal, vertical });
  };

  const handleMouseDown = (e, element) => {
    e.stopPropagation();
    
    // Check if Ctrl/Cmd key is pressed for multi-select
    const isMultiSelect = e.ctrlKey || e.metaKey;
    
    // Select the element (with multi-select if applicable)
    onSelectElement(element, isMultiSelect);
    
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setDraggingId(element.id);
    // Element positions are in mm, convert to px for drag calculations
    const elementXPx = (element.x || 0) * MM_TO_PX;
    const elementYPx = (element.y || 0) * MM_TO_PX;
    setDragOffset({
      x: e.clientX - elementXPx,
      y: e.clientY - elementYPx,
    });
  };

  const handleResizeStart = (e, element, handle) => {
    e.stopPropagation();
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setResizingId(element.id);
    setResizeHandle(handle);
    // Element dimensions are in mm, convert to px for resize calculations
    const widthPx = (element.width || 0) * MM_TO_PX;
    const heightPx = (element.height || 0) * MM_TO_PX;
    const leftPx = (element.x || 0) * MM_TO_PX;
    const topPx = (element.y || 0) * MM_TO_PX;
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: widthPx,
      height: heightPx,
      left: leftPx,
      top: topPx,
    });
  };

  const handleMouseMove = (e) => {
    if (draggingId && !resizingId) {
      const element = elements.find(el => el.id === draggingId);
      if (!element) return;

      const newXPx = e.clientX - dragOffset.x;
      const newYPx = e.clientY - dragOffset.y;

      // Convert px back to mm before saving
      let newXMm = newXPx / MM_TO_PX;
      let newYMm = newYPx / MM_TO_PX;

      // Apply snap-to-grid
      newXMm = snapToGrid(newXMm);
      newYMm = snapToGrid(newYMm);

      // Calculate smart guides
      calculateSmartGuides(element, newXMm, newYMm, element.width, element.height);

      const maxXMm = pageWidth - MIN_EDGE_MARGIN_MM;
      const maxYMm = pageHeight - MIN_EDGE_MARGIN_MM;

      onUpdateElement(draggingId, {
        x: Math.max(0, Math.min(newXMm, maxXMm)),
        y: Math.max(0, Math.min(newYMm, maxYMm)),
      });
    } else if (resizingId) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let updates = {};

      // Calculate new dimensions in px first, then convert to mm
      const minSizePx = MIN_ELEMENT_SIZE_MM * MM_TO_PX; // Convert min size to px for calculations
      switch (resizeHandle) {
        case 'se': // bottom-right
          updates = {
            width: Math.max(minSizePx, resizeStart.width + dx) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height + dy) / MM_TO_PX,
          };
          break;
        case 'sw': // bottom-left
          updates = {
            x: (resizeStart.left + dx) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dx) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height + dy) / MM_TO_PX,
          };
          break;
        case 'ne': // top-right
          updates = {
            y: (resizeStart.top + dy) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width + dx) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dy) / MM_TO_PX,
          };
          break;
        case 'nw': // top-left
          updates = {
            x: (resizeStart.left + dx) / MM_TO_PX,
            y: (resizeStart.top + dy) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dx) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dy) / MM_TO_PX,
          };
          break;
        case 'n': // top
          updates = {
            y: (resizeStart.top + dy) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dy) / MM_TO_PX,
          };
          break;
        case 's': // bottom
          updates = {
            height: Math.max(minSizePx, resizeStart.height + dy) / MM_TO_PX,
          };
          break;
        case 'e': // right
          updates = {
            width: Math.max(minSizePx, resizeStart.width + dx) / MM_TO_PX,
          };
          break;
        case 'w': // left
          updates = {
            x: (resizeStart.left + dx) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dx) / MM_TO_PX,
          };
          break;
      }

      onUpdateElement(resizingId, updates);
    }
  };

  const handleMouseUp = (e) => {
    // End drag/resize but KEEP the selection
    // Selection was already set in handleMouseDown
    setDraggingId(null);
    setResizingId(null);
    setResizeHandle(null);
    setMouseDownPos(null);
    // Clear smart guides when drag ends
    setSmartGuides({ horizontal: [], vertical: [] });
  };

  React.useEffect(() => {
    if (draggingId || resizingId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, resizingId, dragOffset, resizeStart, resizeHandle, mouseDownPos]);

  const renderElement = (element) => {
    const isSelected = selectedElement?.id === element.id;
    const isInMultiSelect = selectedElements.some(el => el.id === element.id);
    // Convert mm to px for rendering
    const xPx = (element.x || 0) * MM_TO_PX;
    const yPx = (element.y || 0) * MM_TO_PX;
    const widthPx = (element.width || 0) * MM_TO_PX;
    const heightPx = (element.height || 0) * MM_TO_PX;
    
    const baseStyle = {
      position: 'absolute',
      left: `${xPx}px`,
      top: `${yPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
      cursor: 'move',
      border: isSelected ? '3px solid #2196F3' : isInMultiSelect ? '2px solid #4CAF50' : '1px dashed #ccc',
      boxSizing: 'border-box',
      opacity: element.opacity ?? 1,
      zIndex: element.zIndex ?? 0,
      backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || undefined),
    };

    const renderResizeHandles = () => {
      if (!isSelected) return null;

      const handleSize = 8;
      const handleStyle = {
        position: 'absolute',
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: '#2196F3',
        border: '1px solid white',
        borderRadius: '50%',
        cursor: 'pointer',
        zIndex: 10,
      };

      return (
        <>
          {/* Corner handles */}
          <div
            style={{ ...handleStyle, top: `-${handleSize / 2}px`, left: `-${handleSize / 2}px`, cursor: 'nw-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'nw')}
          />
          <div
            style={{ ...handleStyle, top: `-${handleSize / 2}px`, right: `-${handleSize / 2}px`, cursor: 'ne-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'ne')}
          />
          <div
            style={{ ...handleStyle, bottom: `-${handleSize / 2}px`, left: `-${handleSize / 2}px`, cursor: 'sw-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'sw')}
          />
          <div
            style={{ ...handleStyle, bottom: `-${handleSize / 2}px`, right: `-${handleSize / 2}px`, cursor: 'se-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'se')}
          />
          {/* Edge handles */}
          <div
            style={{ ...handleStyle, top: `-${handleSize / 2}px`, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'n')}
          />
          <div
            style={{ ...handleStyle, bottom: `-${handleSize / 2}px`, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 's')}
          />
          <div
            style={{ ...handleStyle, left: `-${handleSize / 2}px`, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'w')}
          />
          <div
            style={{ ...handleStyle, right: `-${handleSize / 2}px`, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' }}
            onMouseDown={(e) => handleResizeStart(e, element, 'e')}
          />
        </>
      );
    };

    if (element.type === 'text') {
      let displayText = element.csvColumn || 'Texte';
      
      // Show prefix/suffix in editor if enabled
      if (element.hasTextModifier && element.csvColumn) {
        const prefix = element.textPrefix || '';
        const suffix = element.textSuffix || '';
        displayText = `${prefix}${element.csvColumn}${suffix}`;
      }
      
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'rgba(255,255,255,0.9)'),
            boxSizing: 'border-box',
            lineHeight: element.lineHeight || 1.2,
            letterSpacing: `${element.letterSpacing || 0}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <span style={{
            backgroundColor: element.highlightEnabled ? (element.highlightColor || '#FFFF00') : 'transparent',
            textAlign: element.textAlign,
            width: '100%',
            textTransform: element.textTransform || 'none',
          }}>
            {displayText}
          </span>
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'logo' || element.type === 'image') {
      let content;
      
      // Compute image styles based on transformations
      const imageRotation = element.imageRotation || 0;
      const imageMask = element.imageMask || 'none';
      const imageCropX = element.imageCropX || 50;
      const imageCropY = element.imageCropY || 50;
      
      // Determine border radius based on mask
      let borderRadiusStyle = '0px';
      if (imageMask === 'circle') {
        borderRadiusStyle = '50%';
      } else if (imageMask === 'rounded') {
        borderRadiusStyle = `${element.borderRadius || 10}px`;
      } else if (imageMask === 'rounded-lg') {
        borderRadiusStyle = `${element.borderRadius || 20}px`;
      }
      
      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: element.fit || 'contain',
        objectPosition: `${imageCropX}% ${imageCropY}%`,
        transform: `rotate(${imageRotation}deg)`,
        borderRadius: borderRadiusStyle,
      };
      
      // Handle logo element with logoPath
      if (element.type === 'logo' && element.logoPath) {
        content = <img src={element.logoPath} alt="logo" style={imageStyle} />;
      }
      // Handle legacy logo format (type: 'image' with source: 'logo')
      else if (element.type === 'image' && element.source === 'logo') {
        content = '🖼️ Logo (ancien format)';
      }
      // Default placeholders
      else if (element.type === 'logo') {
        content = '🖼️ Logo';
      } else {
        content = '📷 Image';
      }

      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || '#f0f0f0'),
            fontSize: '12px',
            color: '#666',
            overflow: 'hidden',
            borderRadius: borderRadiusStyle,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {content}
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'line') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            borderBottom: `${element.thickness}px ${element.style} ${element.color}`,
            height: 'auto',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'rectangle') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: element.backgroundColor,
            border: `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`,
            borderRadius: `${element.borderRadius}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'freeText') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'rgba(255,255,255,0.9)'),
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box',
            lineHeight: element.lineHeight || 1.2,
            letterSpacing: `${element.letterSpacing || 0}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <span style={{
            backgroundColor: element.highlightEnabled ? (element.highlightColor || '#FFFF00') : 'transparent',
            textAlign: element.textAlign,
            width: '100%',
            textTransform: element.textTransform || 'none',
          }}>
            {element.content || 'Texte libre'}
          </span>
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'jsCode') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'rgba(255,255,200,0.9)'),
            border: isSelected ? '3px solid #2196F3' : '1px dashed #f90',
            boxSizing: 'border-box',
            lineHeight: element.lineHeight || 1.2,
            letterSpacing: `${element.letterSpacing || 0}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <span style={{
            backgroundColor: element.highlightEnabled ? (element.highlightColor || '#FFFF00') : 'transparent',
            textAlign: element.textAlign,
            width: '100%',
            textTransform: element.textTransform || 'none',
          }}>
            💻 Code JS
          </span>
          {renderResizeHandles()}
        </div>
      );
    }

    // Table element
    if (element.type === 'table') {
      const columns = element.columns || [];
      const sampleRows = 3; // Show 3 sample rows in canvas
      
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: 'white',
            border: isSelected ? '3px solid #2196F3' : isInMultiSelect ? '2px solid #4CAF50' : '1px solid #ddd',
            overflow: 'hidden',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <table style={{
            width: '100%',
            height: '100%',
            borderCollapse: 'collapse',
            fontSize: `${(element.fontSize || 10) * 0.8}px`,
            fontFamily: element.fontFamily || 'Arial',
          }}>
            {element.showHeaders && (
              <thead>
                <tr style={{ backgroundColor: element.headerBackgroundColor || '#f0f0f0' }}>
                  {columns.map((col, idx) => (
                    <th key={idx} style={{
                      border: `${element.borderWidth || 1}px solid ${element.borderColor || '#000'}`,
                      padding: `${(element.cellPadding || 2) * 0.5}px`,
                      color: element.headerTextColor || '#000',
                      textAlign: element.textAlign || 'left',
                      fontSize: '8px',
                    }}>
                      {col.label || col.csvColumn || `Col ${idx + 1}`}
                    </th>
                  ))}
                  {columns.length === 0 && (
                    <th style={{ padding: '4px', fontSize: '8px' }}>
                      Configurer colonnes →
                    </th>
                  )}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: sampleRows }).map((_, rowIdx) => (
                <tr key={rowIdx} style={{
                  backgroundColor: element.alternateRowColor && rowIdx % 2 === 1 
                    ? (element.alternateColor || '#f9f9f9') 
                    : 'white',
                }}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} style={{
                      border: `${element.borderWidth || 1}px solid ${element.borderColor || '#000'}`,
                      padding: `${(element.cellPadding || 2) * 0.5}px`,
                      textAlign: element.textAlign || 'left',
                      fontSize: '8px',
                    }}>
                      {col.csvColumn || '...'}
                    </td>
                  ))}
                  {columns.length === 0 && (
                    <td style={{ padding: '4px', fontSize: '8px', color: '#999' }}>
                      Exemple données
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '4px',
            fontSize: '10px',
            color: '#666',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none',
          }}>
            📊 Tableau ({columns.length} colonnes)
          </div>
          {renderResizeHandles()}
        </div>
      );
    }

    // Group element
    if (element.type === 'group') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: 'rgba(200, 200, 255, 0.1)',
            border: isSelected ? '3px dashed #2196F3' : isInMultiSelect ? '2px dashed #4CAF50' : '1px dashed #999',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {/* Render children relative to group */}
          {element.children?.map(child => {
            const childXPx = (child.x || 0) * MM_TO_PX;
            const childYPx = (child.y || 0) * MM_TO_PX;
            const childWidthPx = (child.width || 0) * MM_TO_PX;
            const childHeightPx = (child.height || 0) * MM_TO_PX;

            return (
              <div
                key={child.id}
                style={{
                  position: 'absolute',
                  left: `${childXPx}px`,
                  top: `${childYPx}px`,
                  width: `${childWidthPx}px`,
                  height: `${childHeightPx}px`,
                  border: '1px solid #ccc',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  fontSize: '10px',
                  padding: '2px',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {child.type === 'text' ? (child.csvColumn || 'Texte') : 
                 child.type === 'logo' ? '🖼️ Logo' :
                 child.type === 'image' ? '📷 Image' :
                 child.type === 'line' ? '➖' :
                 child.type === 'rectangle' ? '▭' :
                 child.type}
              </div>
            );
          })}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '4px',
            fontSize: '10px',
            color: '#666',
            pointerEvents: 'none',
          }}>
            📦 Groupe ({element.children?.length || 0} éléments)
          </div>
          {renderResizeHandles()}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.canvasWrapper}>
        <div
          style={{
            ...styles.canvas,
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundColor: pageConfig.backgroundColor || '#FFFFFF',
          }}
          onClick={(e) => {
            // Only deselect if clicking directly on canvas (not on an element)
            if (e.target === e.currentTarget || e.target.style.pointerEvents === 'none') {
              onSelectElement(null);
            }
          }}
        >
          {/* Grid background */}
          {gridSettings.enabled && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <defs>
                <pattern
                  id="grid"
                  width={gridSettings.size * MM_TO_PX}
                  height={gridSettings.size * MM_TO_PX}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSettings.size * MM_TO_PX} 0 L 0 0 0 ${gridSettings.size * MM_TO_PX}`}
                    fill="none"
                    stroke="#ddd"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Smart guides */}
          {gridSettings.showSmartGuides && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              {smartGuides.horizontal.map((guide, idx) => (
                <line
                  key={`h-${idx}`}
                  x1="0"
                  y1={guide.position * MM_TO_PX}
                  x2={canvasWidth}
                  y2={guide.position * MM_TO_PX}
                  stroke="#FF00FF"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}
              {smartGuides.vertical.map((guide, idx) => (
                <line
                  key={`v-${idx}`}
                  x1={guide.position * MM_TO_PX}
                  y1="0"
                  x2={guide.position * MM_TO_PX}
                  y2={canvasHeight}
                  stroke="#FF00FF"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}
            </svg>
          )}

          {/* Render all elements */}
          {elements.map((element) => renderElement(element))}

          {/* Page info */}
          <div style={styles.pageInfo}>
            {pageConfig.format} - {pageConfig.orientation} ({pageWidth} x {pageHeight} mm)
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'auto',
    backgroundColor: '#e0e0e0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // Allow flex item to shrink
  },
  canvasWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100%',
  },
  canvas: {
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    position: 'relative',
    userSelect: 'none',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05) 76%, transparent 77%, transparent)
    `,
    backgroundSize: '50px 50px',
    pointerEvents: 'none',
  },
  pageInfo: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    fontSize: '11px',
    color: '#666',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '5px 10px',
    borderRadius: '3px',
    pointerEvents: 'none',
  },
};

export default TemplateCanvas;
