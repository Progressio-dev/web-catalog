import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TemplateSelector = ({ onTemplateSelected }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/templates');
      // Filter only active templates for users
      const activeTemplates = response.data.filter((t) => t.is_active);
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Fetch templates error:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template) => {
    onTemplateSelected(template);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>⏳</div>
        <p>Chargement des templates...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📄</div>
        <h3>Aucun template disponible</h3>
        <p>Veuillez contacter l'administrateur pour créer un template.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sélectionnez un template</h2>
      <p style={styles.subtitle}>
        Choisissez le modèle de fiche produit que vous souhaitez utiliser
      </p>

      <div style={styles.grid}>
        {templates.map((template) => (
          <div
            key={template.id}
            style={styles.card}
            onClick={() => handleSelect(template)}
          >
            <div style={styles.cardPreview}>
              <div style={styles.previewIcon}>📄</div>
              <div style={styles.previewFormat}>
                {template.page_format || 'A4'}
                <br />
                {template.page_orientation === 'landscape' ? '📃 Paysage' : '📄 Portrait'}
              </div>
            </div>

            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{template.name}</h3>
              <div style={styles.cardInfo}>
                <p>Format: {template.page_format || 'A4'}</p>
                <p>
                  Orientation:{' '}
                  {template.page_orientation === 'landscape' ? 'Paysage' : 'Portrait'}
                </p>
              </div>
              <button style={styles.cardButton}>
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
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '40px',
  },
  loading: {
    padding: '80px',
    textAlign: 'center',
    color: '#666',
  },
  spinner: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  empty: {
    padding: '80px 20px',
    textAlign: 'center',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
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
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  cardPreview: {
    height: '200px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #ddd',
  },
  previewIcon: {
    fontSize: '64px',
    marginBottom: '15px',
  },
  previewFormat: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  cardInfo: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  cardButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default TemplateSelector;
