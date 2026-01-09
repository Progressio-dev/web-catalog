import React from 'react';

const TemplatePreview = ({ elements, pageConfig, sampleData }) => {
  const renderPreviewElement = (element) => {
    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
    };

    if (element.type === 'text') {
      const content = sampleData?.[element.csvColumn] || element.csvColumn || '';
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
          Logo
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

  // Scaling for preview
  const scale = 0.5;

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Aperçu</h4>
      <div style={styles.previewWrapper}>
        <div
          style={{
            ...styles.preview,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {elements.map((element) => renderPreviewElement(element))}
        </div>
      </div>
      <p style={styles.info}>Aperçu avec données exemple du CSV</p>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    borderTop: '1px solid #ddd',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  previewWrapper: {
    width: '100%',
    height: '300px',
    overflow: 'auto',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
    padding: '10px',
  },
  preview: {
    position: 'relative',
    width: '525px',
    height: '742px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  info: {
    fontSize: '11px',
    color: '#666',
    marginTop: '8px',
    fontStyle: 'italic',
  },
};

export default TemplatePreview;
