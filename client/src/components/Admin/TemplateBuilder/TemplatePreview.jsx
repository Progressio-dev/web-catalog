import React from 'react';

const PAGE_FORMATS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
};

const TemplatePreview = ({ elements, pageConfig, sampleData, allSampleData }) => {
  const [zoom, setZoom] = React.useState(1);
  const [currentRowIndex, setCurrentRowIndex] = React.useState(0);

  const pageWidth =
    pageConfig.format === 'Custom'
      ? pageConfig.width
      : PAGE_FORMATS[pageConfig.format]?.width || 210;
  const pageHeight =
    pageConfig.format === 'Custom'
      ? pageConfig.height
      : PAGE_FORMATS[pageConfig.format]?.height || 297;

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

  const renderPreviewElement = (element) => {
    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
    };

    if (element.type === 'text') {
      const content = displayData?.[element.csvColumn] || element.csvColumn || '';
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
            wordWrap: element.wordWrap ? 'break-word' : 'normal',
            overflow: 'hidden',
          }}
        >
          {content}
        </div>
      );
    }

    if (element.type === 'logo') {
      const content = element.logoPath 
        ? <img src={element.logoPath} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : 'Logo';

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
          {content}
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
            borderBottom: `${element.thickness}px ${element.style} ${element.color}`,
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
            border: `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`,
            borderRadius: `${element.borderRadius}px`,
          }}
        />
      );
    }

    return null;
  };

  // Scaling for preview - convert mm to pixels
  const scale = 2.5 * zoom;
  const previewWidth = pageWidth * scale;
  const previewHeight = pageHeight * scale;

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
