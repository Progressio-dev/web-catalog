import React, { useState, useEffect } from 'react';
import { templateAPI } from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Step1TemplateSelector - Displays a grid of active templates for selection
 */
const Step1TemplateSelector = ({ onTemplateSelected }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templateAPI.getActive();
      setTemplates(response.data);
    } catch (error) {
      console.error('Fetch templates error:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>Chargement des templates...</p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <h2>📄 Aucun template disponible</h2>
          <p>Contactez l'administrateur pour créer des templates.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📄 Étape 1/4 - Choisissez un template</h2>
      <div style={styles.grid}>
        {templates.map((template) => (
          <div key={template.id} style={styles.card}>
            <div style={styles.cardPreview}>
              <div style={styles.previewPlaceholder}>
                📄
              </div>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{template.name}</h3>
              <p style={styles.cardFormat}>
                {template.page_format} - {template.page_orientation === 'landscape' ? 'Paysage' : 'Portrait'}
              </p>
              <button
                onClick={() => onTemplateSelected(template)}
                style={styles.selectButton}
              >
                Utiliser ce template →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '25px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardPreview: {
    height: '200px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholder: {
    fontSize: '64px',
    opacity: 0.3,
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  cardFormat: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  selectButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default Step1TemplateSelector;
