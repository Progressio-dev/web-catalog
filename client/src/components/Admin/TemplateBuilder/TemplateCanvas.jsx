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
  const MIN_ELEMENT_SIZE_MM = 8; // Minimum element size in mm (20px / 2.5)
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

  const handleMouseDown = (e, element) => {
    e.stopPropagation();
    
    // ALWAYS select the element immediately
    onSelectElement(element);
    
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
      const newXPx = e.clientX - dragOffset.x;
      const newYPx = e.clientY - dragOffset.y;

      // Convert px back to mm before saving
      const newXMm = newXPx / MM_TO_PX;
      const newYMm = newYPx / MM_TO_PX;
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
      border: isSelected ? '3px solid #2196F3' : '1px dashed #ccc',
      boxSizing: 'border-box',
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
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.9)',
            boxSizing: 'border-box',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {displayText}
          {renderResizeHandles()}
        </div>
      );
    }

    if (element.type === 'logo' || element.type === 'image') {
      const content = element.type === 'logo' && element.logoPath 
        ? <img src={element.logoPath} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : element.type === 'logo' ? '🖼️ Logo' : '📷 Image';

      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            fontSize: '12px',
            color: '#666',
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
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.9)',
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {element.content || 'Texte libre'}
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
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: '4px',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,200,0.9)',
            border: isSelected ? '3px solid #2196F3' : '1px dashed #f90',
            boxSizing: 'border-box',
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          💻 Code JS
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
          <div style={styles.grid} />

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
    overflow: 'auto',
    backgroundColor: '#e0e0e0',
    padding: '20px',
  },
  canvasWrapper: {
    display: 'flex',
    justifyContent: 'center',
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
