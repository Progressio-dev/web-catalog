import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import TemplateBuilder from './TemplateBuilder';

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Fetch templates error:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template supprimé');
      fetchTemplates();
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/templates/${id}/duplicate`);
      toast.success('Template dupliqué');
      fetchTemplates();
    } catch (error) {
      console.error('Duplicate template error:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      await api.put(`/templates/${template.id}`, {
        is_active: template.is_active ? 0 : 1,
      });
      toast.success(
        template.is_active ? 'Template désactivé' : 'Template activé'
      );
      fetchTemplates();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setShowBuilder(true);
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  if (showBuilder) {
    return (
      <TemplateBuilder
        template={editingTemplate}
        onSave={fetchTemplates}
        onCancel={handleBuilderClose}
      />
    );
  }

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Templates</h2>
        <button onClick={handleNew} style={styles.btnNew}>
          + Nouveau Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div style={styles.empty}>
          <p>Aucun template. Créez-en un pour commencer!</p>
          <button onClick={handleNew} style={styles.btnPrimary}>
            Créer mon premier template
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {templates.map((template) => (
            <div key={template.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{template.name}</h3>
                <span
                  style={{
                    ...styles.badge,
                    ...(template.is_active ? styles.badgeActive : styles.badgeInactive),
                  }}
                >
                  {template.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div style={styles.cardInfo}>
                <p>
                  <strong>Format:</strong> {template.page_format || 'A4'}
                </p>
                <p>
                  <strong>Orientation:</strong> {template.page_orientation || 'Portrait'}
                </p>
                <p>
                  <strong>Séparateur CSV:</strong> {template.csv_separator || ','}
                </p>
                <p style={styles.cardDate}>
                  Créé: {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => handleEdit(template)}
                  style={styles.btnEdit}
                >
                  ✏️ Éditer
                </button>
                <button
                  onClick={() => handleDuplicate(template.id)}
                  style={styles.btnSecondary}
                >
                  📋 Dupliquer
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  style={styles.btnSecondary}
                >
                  {template.is_active ? '🚫 Désactiver' : '✅ Activer'}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  style={styles.btnDelete}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
  },
  btnNew: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  btnPrimary: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  badgeActive: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  badgeInactive: {
    backgroundColor: '#ddd',
    color: '#666',
  },
  cardInfo: {
    marginBottom: '20px',
    fontSize: '14px',
    color: '#666',
  },
  cardDate: {
    fontSize: '12px',
    color: '#999',
    marginTop: '10px',
  },
  cardActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  btnEdit: {
    gridColumn: '1 / -1',
    padding: '8px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  btnSecondary: {
    padding: '8px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  btnDelete: {
    padding: '8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

export default TemplateList;
