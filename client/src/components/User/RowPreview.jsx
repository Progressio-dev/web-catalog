import React, { useEffect, useState } from 'react';
import api from '../../services/api';

/**
 * RowPreview - Visual preview component for CSV row data
 * Fetches and displays the rendered preview from backend
 */
const RowPreview = ({ row, template, logos }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(0.5);
  const previewWrapperRef = React.useRef(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!row || !template) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await api.post('/preview', {
          templateId: template.id,
          rowData: row
        });
        
        setPreviewHtml(response.data.html);
      } catch (error) {
        console.error('Preview error:', error);
        setError('Erreur de chargement de l\'aperçu');
        setPreviewHtml('');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [row, template]); // Remove 'logos' dependency to prevent unnecessary re-fetches

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Chargement de l'aperçu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!previewHtml) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <p>Aucun aperçu disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <label style={styles.zoomLabel}>
          🔍 Zoom: {Math.round(zoom * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={styles.zoomSlider}
        />
      </div>
      <div style={styles.previewWrapper} ref={previewWrapperRef}>
        <div
          // SECURITY NOTE: The HTML comes from our own trusted backend service
          // which generates preview content from the template and data.
          // The backend sanitizes user input and uses server-side rendering.
          // If additional security is needed, consider implementing CSP headers.
          dangerouslySetInnerHTML={{ __html: previewHtml }}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            // Don't override width/height - let the HTML's mm units work naturally
          }}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  zoomLabel: {
    fontSize: '13px',
    fontWeight: '500',
    minWidth: '100px',
  },
  zoomSlider: {
    flex: 1,
    cursor: 'pointer',
  },
  previewWrapper: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f0f0f0',
    padding: '20px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2196F3',
    borderRadius: '50%',
    marginBottom: '15px',
    animation: 'spinnerRotate 1s linear infinite',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#f44336',
    fontSize: '14px',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '14px',
  },
};

// Inject CSS animation as a style tag once
if (typeof document !== 'undefined' && !document.getElementById('row-preview-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'row-preview-styles';
  styleSheet.textContent = `
    @keyframes spinnerRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default RowPreview;
