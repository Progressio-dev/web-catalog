import React from 'react';
import { logoAPI } from '../../../services/api';

const PAGE_FORMATS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
};

const TemplatePreview = ({ elements, pageConfig, sampleData, allSampleData }) => {
  const [zoom, setZoom] = React.useState(1);
  const [currentRowIndex, setCurrentRowIndex] = React.useState(0);
  const [codeResults, setCodeResults] = React.useState({});
  const [logos, setLogos] = React.useState([]);

  // Fetch logos on mount
  React.useEffect(() => {
    const fetchLogos = async () => {
      try {
        const response = await logoAPI.getAll();
        setLogos(response.data.filter(logo => logo.is_active));
      } catch (error) {
        console.error('Error fetching logos:', error);
      }
    };
    fetchLogos();
  }, []);

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

  // Use the current row's data or fallback to the passed sampleData
  const displayData = allSampleData && allSampleData.length > 0 
    ? allSampleData[currentRowIndex] 
    : sampleData;

  const totalRows = allSampleData?.length || 1;

  const handlePrevRow = () => {
    setCurrentRowIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextRow = () => {
    setCurrentRowIndex((prev) => Math.min(totalRows - 1, prev + 1));
  };

  const handleJumpToRow = (e) => {
    const value = parseInt(e.target.value) - 1;
    if (!isNaN(value) && value >= 0 && value < totalRows) {
      setCurrentRowIndex(value);
    }
  };

  // Execute JavaScript code with timeout
  const executeJsCode = async (code, rowData) => {
    try {
      // Create async function from code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('data', code);
      
      // Execute with timeout (5 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Le code a pris plus de 5 secondes')), 5000)
      );
      
      const result = await Promise.race([
        fn(rowData || {}),
        timeoutPromise
      ]);
      
      return String(result);
    } catch (error) {
      console.error('Erreur d\'exécution du code JS:', error);
      // Use generic error message to avoid exposing system details
      return '❌ Erreur d\'exécution du code';
    }
  };

  // Execute all JS code elements when data changes
  React.useEffect(() => {
    const executeAllJsElements = async () => {
      const results = {};
      const jsElements = elements.filter(el => el.type === 'jsCode');
      
      for (const element of jsElements) {
        if (element.code) {
          results[element.id] = await executeJsCode(element.code, displayData);
        } else {
          results[element.id] = '(code vide)';
        }
      }
      
      setCodeResults(results);
    };
    
    if (displayData) {
      executeAllJsElements();
    }
  }, [elements, displayData]);

  const renderPreviewElement = (element) => {
    // Convert mm to px for rendering with zoom
    // At 96 DPI: 1 inch = 96px, 1 inch = 25.4mm → 1mm = 96/25.4 ≈ 3.779528px
    const MM_TO_PX = 3.779528;
    const xPx = (element.x || 0) * MM_TO_PX * zoom;
    const yPx = (element.y || 0) * MM_TO_PX * zoom;
    const widthPx = (element.width || 0) * MM_TO_PX * zoom;
    const heightPx = (element.height || 0) * MM_TO_PX * zoom;
    
    const baseStyle = {
      position: 'absolute',
      left: `${xPx}px`,
      top: `${yPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    };

    if (element.type === 'text') {
      let content = displayData?.[element.csvColumn] || element.csvColumn || '';
      
      // Apply prefix/suffix if enabled
      if (element.hasTextModifier && element.csvColumn) {
        const prefix = element.textPrefix || '';
        const suffix = element.textSuffix || '';
        const csvValue = displayData?.[element.csvColumn] || '';
        content = `${prefix}${csvValue}${suffix}`;
      }
      
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            fontSize: `${(element.fontSize || 12) * zoom}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: `${4 * zoom}px`,
            wordWrap: element.wordWrap ? 'break-word' : 'normal',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {content}
        </div>
      );
    }

    if (element.type === 'logo') {
      // Find logo by ID
      const logo = logos?.find(l => l.id === element.logoId || l.id === parseInt(element.logoId));
      
      // Use logo from database or fallback to stored path in element
      let logoPath = logo?.path || element.logoPath;
      
      if (logoPath) {
        // Build correct logo URL - handle both absolute URLs and relative paths
        let logoUrl;
        if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
          // Absolute URL - use as is
          logoUrl = logoPath;
        } else if (logoPath.startsWith('/uploads/')) {
          // Already has /uploads/ prefix - use as is (proxy handles it)
          logoUrl = logoPath;
        } else {
          // Relative path without /uploads/ - add it
          logoUrl = `/uploads/${logoPath}`;
        }
          
        return (
          <div key={element.id} style={baseStyle}>
            <img 
              src={logoUrl}
              alt={logo?.name || 'Logo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('Logo load error:', logoUrl, 'Original path:', logoPath);
                // Hide the broken image
                e.target.style.opacity = '0';
              }}
            />
          </div>
        );
      }
      
      // Fallback if logo not found
      return (
        <div key={element.id} style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #ccc',
          fontSize: '10px',
          color: '#999'
        }}>
          Logo non trouvé
        </div>
      );
    }

    // Handle legacy logo format (type: 'image' with source: 'logo')
    if (element.type === 'image' && element.source === 'logo') {
      // Find the first active logo or any available logo
      const logo = logos && logos.length > 0 ? logos[0] : null;
      
      if (logo && logo.path) {
        // Build correct logo URL - handle both absolute URLs and relative paths
        let logoUrl;
        if (logo.path.startsWith('http://') || logo.path.startsWith('https://')) {
          logoUrl = logo.path;
        } else if (logo.path.startsWith('/uploads/')) {
          logoUrl = logo.path;
        } else {
          logoUrl = `/uploads/${logo.path}`;
        }
        
        return (
          <div key={element.id} style={baseStyle}>
            <img 
              src={logoUrl}
              alt={logo.name || 'Logo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('Legacy logo load error:', logoUrl);
                e.target.style.opacity = '0';
              }}
            />
          </div>
        );
      }
      
      // Fallback if no logo found
      return (
        <div key={element.id} style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #ccc',
          fontSize: '10px',
          color: '#999'
        }}>
          Logo non trouvé
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            fontSize: '10px',
            color: '#999',
          }}
        >
          Image
        </div>
      );
    }

    if (element.type === 'line') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            borderBottom: `${(element.thickness || 1) * zoom}px ${element.style} ${element.color}`,
          }}
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
            border: `${(element.borderWidth || 1) * zoom}px ${element.borderStyle} ${element.borderColor}`,
            borderRadius: `${(element.borderRadius || 0) * zoom}px`,
          }}
        />
      );
    }

    if (element.type === 'freeText') {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            fontSize: `${(element.fontSize || 14) * zoom}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: `${4 * zoom}px`,
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {element.content || 'Texte libre'}
        </div>
      );
    }

    if (element.type === 'jsCode') {
      const result = codeResults[element.id] || 'Chargement...';
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            fontSize: `${(element.fontSize || 14) * zoom}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.color,
            textAlign: element.textAlign,
            padding: `${4 * zoom}px`,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {result}
        </div>
      );
    }

    return null;
  };

  // Scaling for preview - convert mm to pixels with zoom
  // At 96 DPI: 1 inch = 96px, 1 inch = 25.4mm → 1mm = 96/25.4 ≈ 3.779528px
  const MM_TO_PX = 3.779528;
  const previewWidth = pageWidth * MM_TO_PX * zoom;
  const previewHeight = pageHeight * MM_TO_PX * zoom;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>👁️ Aperçu en temps réel</h4>
        
        <div style={styles.controls}>
          {/* Zoom controls */}
          <div style={styles.zoomControls}>
            <button 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              style={styles.zoomBtn}
              title="Zoom arrière"
            >
              −
            </button>
            <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              style={styles.zoomBtn}
              title="Zoom avant"
            >
              +
            </button>
          </div>

          {/* Navigation controls */}
          {totalRows > 1 && (
            <div style={styles.navControls}>
              <button 
                onClick={handlePrevRow}
                disabled={currentRowIndex === 0}
                style={{
                  ...styles.navBtn,
                  opacity: currentRowIndex === 0 ? 0.5 : 1,
                }}
              >
                ←
              </button>
              <div style={styles.rowIndicator}>
                <span>Ligne </span>
                <input
                  type="number"
                  min="1"
                  max={totalRows}
                  value={currentRowIndex + 1}
                  onChange={handleJumpToRow}
                  style={styles.rowInput}
                />
                <span> / {totalRows}</span>
              </div>
              <button 
                onClick={handleNextRow}
                disabled={currentRowIndex === totalRows - 1}
                style={{
                  ...styles.navBtn,
                  opacity: currentRowIndex === totalRows - 1 ? 0.5 : 1,
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.previewWrapper}>
        <div
          style={{
            ...styles.preview,
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            backgroundColor: pageConfig.backgroundColor || '#FFFFFF',
          }}
        >
          {elements.map((element) => renderPreviewElement(element))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: '15px',
    borderBottom: '1px solid #ddd',
    backgroundColor: 'white',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  controls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  zoomBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: {
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '45px',
    textAlign: 'center',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  navBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  rowIndicator: {
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  rowInput: {
    width: '50px',
    padding: '4px 6px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    textAlign: 'center',
    fontSize: '13px',
  },
  previewWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  preview: {
    position: 'relative',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    margin: '0 auto',
  },
};

export default TemplatePreview;
