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
  }, [row, template, logos]);

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
      <div style={styles.previewWrapper}>
        <div
          dangerouslySetInnerHTML={{ __html: previewHtml }}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`
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
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
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

// Add spinner animation in a style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default RowPreview;
