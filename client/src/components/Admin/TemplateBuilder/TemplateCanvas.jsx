import React from 'react';
import { calculateBorderRadius } from '../../../utils/imageUtils';
import api from '../../../services/api';

const PAGE_FORMATS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
};

const DEFAULT_ELEMENT_Z_INDEX = 1; // Ensure elements appear above grid (z-index 0)
const MAX_GROUP_DEPTH = 10; // Prevent infinite recursion in nested groups

const TemplateCanvas = ({
  pageConfig,
  elements,
  selectedElement,
  selectedElements = [],
  gridSettings = { enabled: false, size: 10, snapToGrid: false, showSmartGuides: true },
  showRealData = false,
  sampleData = null,
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
  const [dragStartState, setDragStartState] = React.useState(null); // Track initial state for history
  const [codeResults, setCodeResults] = React.useState({}); // Store JS code execution results
  const [imageUrls, setImageUrls] = React.useState({}); // Store fetched image URLs
  
  // Canvas navigation state
  const [canvasZoom, setCanvasZoom] = React.useState(1);
  const [canvasPan, setCanvasPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const canvasContainerRef = React.useRef(null);


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

  // Center canvas on initial load
  React.useEffect(() => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const panX = (rect.width - canvasWidth) / 2;
    const panY = (rect.height - canvasHeight) / 2;
    setCanvasPan({ x: panX, y: panY });
  }, [canvasWidth, canvasHeight]); // Recenter when canvas size changes

  // Helper function: Zoom centered on viewport
  const zoomToViewportCenter = React.useCallback((zoomFactor) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const canvasPointX = (centerX - canvasPan.x) / canvasZoom;
    const canvasPointY = (centerY - canvasPan.y) / canvasZoom;
    const newZoom = Math.max(0.1, Math.min(5, canvasZoom * zoomFactor));
    setCanvasPan({
      x: centerX - canvasPointX * newZoom,
      y: centerY - canvasPointY * newZoom,
    });
    setCanvasZoom(newZoom);
  }, [canvasZoom, canvasPan]);

  // Helper function: Reset to 100% zoom and center
  const resetZoomAndCenter = React.useCallback(() => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const panX = (rect.width - canvasWidth) / 2;
    const panY = (rect.height - canvasHeight) / 2;
    setCanvasZoom(1);
    setCanvasPan({ x: panX, y: panY });
  }, [canvasWidth, canvasHeight]);

  // Handle delete key and keyboard shortcuts for zoom/pan
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElement) {
        onDeleteElement(selectedElement.id);
      }
      // Track space key for pan mode
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      
      // Keyboard shortcuts for zoom (Ctrl/Cmd + Plus/Minus)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomToViewportCenter(1.2);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          zoomToViewportCenter(0.8);
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoomAndCenter();
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElement, onDeleteElement, isSpacePressed, zoomToViewportCenter, resetZoomAndCenter]);

  // Handle mouse wheel for zoom with improved ergonomics
  React.useEffect(() => {
    const handleWheel = (e) => {
      if (!canvasContainerRef.current) return;
      
      // Check if mouse is over the canvas container
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const isOverCanvas = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      
      if (!isOverCanvas) return;
      
      e.preventDefault();
      
      const delta = -e.deltaY;
      // Smoother zoom: use smaller increments for better control
      const zoomFactor = delta > 0 ? 1.08 : 0.92;
      const newZoom = Math.max(0.1, Math.min(5, canvasZoom * zoomFactor));
      
      // Calculate mouse position relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate the point on the canvas that's under the mouse (in canvas coordinates)
      // We need to account for current pan and zoom
      const canvasPointX = (mouseX - canvasPan.x) / canvasZoom;
      const canvasPointY = (mouseY - canvasPan.y) / canvasZoom;
      
      // After zoom, this point should still be under the mouse
      // newMousePos = canvasPoint * newZoom + newPan
      // mouseX = canvasPointX * newZoom + newPan.x
      // newPan.x = mouseX - canvasPointX * newZoom
      setCanvasPan({
        x: mouseX - canvasPointX * newZoom,
        y: mouseY - canvasPointY * newZoom,
      });
      
      setCanvasZoom(newZoom);
    };
    
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [canvasZoom, canvasPan]); // Include canvasPan in dependencies for proper zoom behavior

  // Handle canvas panning with middle mouse or space+drag
  const handleCanvasMouseDown = (e) => {
    // Middle mouse button (1) or left button with space key
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    // Don't pan if we're dragging or resizing an element
    if (isPanning && !draggingId && !resizingId) {
      e.preventDefault();
      setCanvasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (e.button === 1 || (e.button === 0 && isPanning)) {
      setIsPanning(false);
    }
  };

  // Execute JavaScript code for preview
  React.useEffect(() => {
    if (!showRealData || !sampleData) {
      setCodeResults({});
      return;
    }

    const executeAllJsElements = async () => {
      const results = {};
      const jsElements = elements.filter(el => el.type === 'jsCode');
      
      for (const element of jsElements) {
        if (element.code) {
          try {
            // Create async function from code
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction('data', element.code);
            
            // Execute with timeout (5 seconds)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            
            const result = await Promise.race([fn(sampleData), timeoutPromise]);
            results[element.id] = String(result);
          } catch (error) {
            results[element.id] = '❌ Erreur';
          }
        } else {
          results[element.id] = '(code vide)';
        }
      }
      
      setCodeResults(results);
    };
    
    executeAllJsElements();
  }, [elements, showRealData, sampleData]);

  // Fetch product images for preview
  React.useEffect(() => {
    if (!showRealData || !sampleData) {
      setImageUrls({});
      return;
    }

    const fetchImages = async () => {
      const imageElements = elements.filter(el => el.type === 'image' && el.source !== 'logo' && el.csvColumn);
      if (imageElements.length === 0) return;

      const requests = [];

      imageElements.forEach(el => {
        const refValue = sampleData[el.csvColumn];
        if (!refValue) return;
        
        const key = `${el.id}-${refValue}`;
        if (imageUrls[key] !== undefined) return;
        
        requests.push({ el, refValue, key });
      });

      if (requests.length === 0) return;

      await Promise.all(
        requests.map(async ({ el, refValue, key }) => {
          try {
            const response = await api.get(`/product-image/${encodeURIComponent(refValue)}`, {
              params: {
                pageUrlTemplate: el.pageUrlTemplate,
                imageSelector: el.imageSelector,
                imageAttribute: el.imageAttribute,
                urlEncodeValue: el.urlEncodeValue !== false && el.urlEncodeValue !== 'false',
                csvColumn: el.csvColumn,
                baseUrl: el.baseUrl,
                extension: el.extension
              }
            });
            setImageUrls(prev => ({ ...prev, [key]: response.data.imageUrl }));
          } catch (error) {
            console.error('Error fetching image:', error);
            setImageUrls(prev => ({ ...prev, [key]: null }));
          }
        })
      );
    };

    fetchImages();
  }, [elements, showRealData, sampleData]);

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
    // Store initial state for history tracking
    setDragStartState({ 
      id: element.id, 
      x: element.x, 
      y: element.y,
      width: element.width,
      height: element.height
    });
    // Calculate offset from mouse to element top-left in screen coordinates
    // Element position in mm -> px -> scaled by zoom -> offset by pan
    const elementScreenX = (element.x || 0) * MM_TO_PX * canvasZoom + canvasPan.x;
    const elementScreenY = (element.y || 0) * MM_TO_PX * canvasZoom + canvasPan.y;
    setDragOffset({
      x: e.clientX - elementScreenX,
      y: e.clientY - elementScreenY,
    });
  };

  const handleResizeStart = (e, element, handle) => {
    e.stopPropagation();
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setResizingId(element.id);
    setResizeHandle(handle);
    // Store initial state for history tracking
    setDragStartState({ 
      id: element.id, 
      x: element.x, 
      y: element.y,
      width: element.width,
      height: element.height
    });
    // Store element dimensions in canvas pixels (not screen pixels)
    // These are base pixel values before zoom is applied
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

      // Convert mouse position to canvas coordinates
      // Mouse is in screen coords, we need canvas coords (in px)
      const canvasX = (e.clientX - dragOffset.x - canvasPan.x) / canvasZoom;
      const canvasY = (e.clientY - dragOffset.y - canvasPan.y) / canvasZoom;

      // Convert px to mm
      let newXMm = canvasX / MM_TO_PX;
      let newYMm = canvasY / MM_TO_PX;

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
      }, true); // Skip history during drag
    } else if (resizingId) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let updates = {};

      // Calculate new dimensions - dx/dy are in screen pixels, need to account for zoom
      const dxCanvas = dx / canvasZoom;
      const dyCanvas = dy / canvasZoom;
      const minSizePx = MIN_ELEMENT_SIZE_MM * MM_TO_PX;
      
      switch (resizeHandle) {
        case 'se': // bottom-right
          updates = {
            width: Math.max(minSizePx, resizeStart.width + dxCanvas) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height + dyCanvas) / MM_TO_PX,
          };
          break;
        case 'sw': // bottom-left
          updates = {
            x: (resizeStart.left + dxCanvas) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dxCanvas) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height + dyCanvas) / MM_TO_PX,
          };
          break;
        case 'ne': // top-right
          updates = {
            y: (resizeStart.top + dyCanvas) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width + dxCanvas) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dyCanvas) / MM_TO_PX,
          };
          break;
        case 'nw': // top-left
          updates = {
            x: (resizeStart.left + dxCanvas) / MM_TO_PX,
            y: (resizeStart.top + dyCanvas) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dxCanvas) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dyCanvas) / MM_TO_PX,
          };
          break;
        case 'n': // top
          updates = {
            y: (resizeStart.top + dyCanvas) / MM_TO_PX,
            height: Math.max(minSizePx, resizeStart.height - dyCanvas) / MM_TO_PX,
          };
          break;
        case 's': // bottom
          updates = {
            height: Math.max(minSizePx, resizeStart.height + dyCanvas) / MM_TO_PX,
          };
          break;
        case 'e': // right
          updates = {
            width: Math.max(minSizePx, resizeStart.width + dxCanvas) / MM_TO_PX,
          };
          break;
        case 'w': // left
          updates = {
            x: (resizeStart.left + dxCanvas) / MM_TO_PX,
            width: Math.max(minSizePx, resizeStart.width - dxCanvas) / MM_TO_PX,
          };
          break;
      }

      onUpdateElement(resizingId, updates, true); // Skip history during resize
    }
  };

  const handleMouseUp = (e) => {
    // When drag/resize ends, push final state to history (one entry for the whole operation)
    if (dragStartState && (draggingId || resizingId)) {
      const elementId = draggingId || resizingId;
      const currentElement = elements.find(el => el.id === elementId);
      
      // Only push to history if the element actually changed
      if (currentElement && (
        currentElement.x !== dragStartState.x ||
        currentElement.y !== dragStartState.y ||
        currentElement.width !== dragStartState.width ||
        currentElement.height !== dragStartState.height
      )) {
        // Call onUpdateElement without skipHistory to add the final state to history
        onUpdateElement(elementId, {
          x: currentElement.x,
          y: currentElement.y,
          width: currentElement.width,
          height: currentElement.height,
        }, false); // Don't skip history - save this final state
      }
    }
    
    // End drag/resize but KEEP the selection
    // Selection was already set in handleMouseDown
    setDraggingId(null);
    setResizingId(null);
    setResizeHandle(null);
    setMouseDownPos(null);
    setDragStartState(null);
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

  const renderElement = (element, depth = 0) => {
    // Prevent infinite recursion in nested groups
    if (depth > MAX_GROUP_DEPTH) {
      console.warn('Maximum group nesting depth exceeded for element:', element.id);
      return null;
    }
    
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
      zIndex: element.zIndex ?? DEFAULT_ELEMENT_Z_INDEX,
      backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || undefined),
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      transformOrigin: 'center center',
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
      
      // Use real data if preview mode is enabled and data is available
      if (showRealData && sampleData && element.csvColumn) {
        displayText = sampleData[element.csvColumn] ?? '';
      }
      
      // Show prefix/suffix in editor if enabled
      if (element.hasTextModifier && element.csvColumn) {
        const prefix = element.textPrefix || '';
        const suffix = element.textSuffix || '';
        if (showRealData && sampleData) {
          const csvValue = sampleData[element.csvColumn] ?? '';
          displayText = `${prefix}${csvValue}${suffix}`;
        } else {
          displayText = `${prefix}${element.csvColumn}${suffix}`;
        }
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
            display: 'block',
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
      const imageCropX = element.imageCropX || 50;
      const imageCropY = element.imageCropY || 50;
      
      // Calculate border radius using shared utility
      const borderRadiusStyle = calculateBorderRadius(element);
      
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
      // Handle image element with preview data
      else if (element.type === 'image' && element.source !== 'logo' && showRealData && sampleData && element.csvColumn) {
        const refValue = sampleData[element.csvColumn];
        const imageUrl = refValue ? imageUrls[`${element.id}-${refValue}`] : null;
        
        if (imageUrl) {
          content = <img src={imageUrl} alt="Product" style={imageStyle} />;
        } else if (refValue && imageUrls[`${element.id}-${refValue}`] === undefined) {
          content = '⏳ Chargement...';
        } else {
          content = '📷 Image';
        }
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
            display: 'block',
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
      // Display executed result if preview mode is enabled
      let displayContent = '💻 Code JS';
      if (showRealData && codeResults[element.id]) {
        displayContent = codeResults[element.id];
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
            backgroundColor: element.blockBackgroundTransparent ? 'transparent' : (element.blockBackgroundColor || 'rgba(255,255,200,0.9)'),
            border: isSelected ? '3px solid #2196F3' : '1px dashed #f90',
            boxSizing: 'border-box',
            lineHeight: element.lineHeight || 1.2,
            letterSpacing: `${element.letterSpacing || 0}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <span style={{
            display: 'block',
            backgroundColor: element.highlightEnabled ? (element.highlightColor || '#FFFF00') : 'transparent',
            textAlign: element.textAlign,
            width: '100%',
            textTransform: element.textTransform || 'none',
          }}>
            {displayContent}
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

    // Free image element
    if (element.type === 'freeImage') {
      const imageCropX = element.imageCropX || 50;
      const imageCropY = element.imageCropY || 50;
      
      // Calculate border radius using shared utility
      const borderRadiusStyle = calculateBorderRadius(element);

      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: element.fit || 'contain',
        objectPosition: `${imageCropX}% ${imageCropY}%`,
        borderRadius: borderRadiusStyle,
      };

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
          {element.imageData ? (
            <img src={element.imageData} alt="Free Image" style={imageStyle} />
          ) : (
            '🖼️ Image Libre (aucune image)'
          )}
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
            overflow: 'visible', // Allow children to be visible
          }}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {/* Render children recursively - now using renderElement for full preview support */}
          {element.children?.map(child => {
            // Create a wrapper div to position the child within the group
            const childElement = renderElement(child, depth + 1);
            
            // Wrap with positioning container
            return (
              <div
                key={child.id}
                style={{
                  position: 'absolute',
                  left: `${(child.x || 0) * MM_TO_PX}px`,
                  top: `${(child.y || 0) * MM_TO_PX}px`,
                  pointerEvents: 'none', // Prevent direct interaction with children in group
                }}
              >
                {childElement}
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
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
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
    <div 
      ref={canvasContainerRef}
      style={{
        ...styles.container,
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default'),
        overflow: 'auto', // Keep scroll bars as fallback
        position: 'relative',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={() => setIsPanning(false)}
    >
      {/* Canvas controls overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1001,
        display: 'flex',
        gap: '8px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '8px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <button
          onClick={() => {
            // Fit canvas to view with some padding - now allows upscaling for better ergonomics
            if (!canvasContainerRef.current) return;
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const padding = 40; // 40px padding
            const availableWidth = rect.width - padding * 2;
            const availableHeight = rect.height - padding * 2;
            
            // Calculate zoom to fit - removed 100% cap for better professional ergonomics
            const zoomX = availableWidth / canvasWidth;
            const zoomY = availableHeight / canvasHeight;
            const fitZoom = Math.max(0.1, Math.min(zoomX, zoomY, 5)); // Allow zoom from 10% to 500%
            
            // Center the canvas
            const scaledWidth = canvasWidth * fitZoom;
            const scaledHeight = canvasHeight * fitZoom;
            const panX = (rect.width - scaledWidth) / 2;
            const panY = (rect.height - scaledHeight) / 2;
            
            setCanvasZoom(fitZoom);
            setCanvasPan({ x: panX, y: panY });
          }}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
          title="Ajuster à la vue (peut zoomer au-delà de 100%)"
        >
          🔍 Fit
        </button>
        <button
          onClick={() => zoomToViewportCenter(1.2)}
          style={{
            padding: '4px 8px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
          title="Zoom avant (Ctrl/Cmd + +)"
        >
          +
        </button>
        <button
          onClick={() => zoomToViewportCenter(0.8)}
          style={{
            padding: '4px 8px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
          title="Zoom arrière (Ctrl/Cmd + -)"
        >
          −
        </button>
        <button
          onClick={resetZoomAndCenter}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
          title="Réinitialiser à 100% et centrer (Ctrl/Cmd + 0)"
        >
          🔄 Reset
        </button>
        <span style={{
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: canvasZoom < 1 ? '#2196F3' : canvasZoom > 1 ? '#FF9800' : '#666',
        }}>
          {Math.round(canvasZoom * 100)}%
        </span>
        {isSpacePressed && (
          <span style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#4CAF50',
            backgroundColor: '#E8F5E9',
            borderRadius: '3px',
          }}>
            ✋ Mode Déplacement
          </span>
        )}
      </div>
      
      <div style={styles.canvasWrapper}>
        <div
          style={{
            ...styles.canvas,
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundColor: pageConfig.backgroundColor || '#FFFFFF',
            transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
            transformOrigin: '0 0',
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
                  id={`grid-pattern-${canvasWidth}-${canvasHeight}`}
                  width={gridSettings.size * MM_TO_PX}
                  height={gridSettings.size * MM_TO_PX}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSettings.size * MM_TO_PX} 0 L 0 0 0 ${gridSettings.size * MM_TO_PX}`}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.15)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-pattern-${canvasWidth}-${canvasHeight})`} />
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
