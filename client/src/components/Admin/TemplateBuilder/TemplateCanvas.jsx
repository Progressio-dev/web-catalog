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

  const pageWidth =
    pageConfig.format === 'Custom'
      ? pageConfig.width
      : PAGE_FORMATS[pageConfig.format]?.width || 210;
  const pageHeight =
    pageConfig.format === 'Custom'
      ? pageConfig.height
      : PAGE_FORMATS[pageConfig.format]?.height || 297;

  // Convert mm to pixels (roughly 3.78 pixels per mm at 96 DPI)
  const scale = 2.5;
  const canvasWidth = pageWidth * scale;
  const canvasHeight = pageHeight * scale;

  const handleMouseDown = (e, element) => {
    e.stopPropagation();
    setDraggingId(element.id);
    setDragOffset({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
    onSelectElement(element);
  };

  const handleMouseMove = (e) => {
    if (!draggingId) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    onUpdateElement(draggingId, {
      x: Math.max(0, Math.min(newX, canvasWidth - 50)),
      y: Math.max(0, Math.min(newY, canvasHeight - 50)),
    });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  React.useEffect(() => {
    if (draggingId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, dragOffset]);

  const renderElement = (element) => {
    const isSelected = selectedElement?.id === element.id;
    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: 'move',
      border: isSelected ? '2px solid #2196F3' : '1px dashed #ccc',
      boxSizing: 'border-box',
    };

    if (element.type === 'text') {
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
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {element.csvColumn || 'Texte'}
        </div>
      );
    }

    if (element.type === 'logo' || element.type === 'image') {
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
          {element.type === 'logo' ? '🖼️ Logo' : '📷 Image'}
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
        />
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
        />
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
          }}
          onClick={() => onSelectElement(null)}
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
