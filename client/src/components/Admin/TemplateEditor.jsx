import React, { useState, useEffect } from 'react';
import { templateAPI } from '../../services/api';
import { toast } from 'react-toastify';
import DragDropCanvas from './DragDropCanvas';

const TemplateEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templateAPI.getAll();
      setTemplates(response.data);
      if (response.data.length > 0 && !selectedTemplate) {
        selectTemplate(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setTemplateName('Nouveau template');
    setIsEditing(true);
  };

  const handleSave = async (config) => {
    try {
      if (selectedTemplate) {
        await templateAPI.update(selectedTemplate.id, {
          name: templateName,
          config,
        });
        toast.success('Template mis à jour');
      } else {
        await templateAPI.create({
          name: templateName,
          config,
        });
        toast.success('Template créé');
      }
      fetchTemplates();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      await templateAPI.delete(id);
      toast.success('Template supprimé');
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Templates</h2>
        <button onClick={handleCreateNew} style={styles.createButton}>
          + Nouveau template
        </button>
        <div style={styles.templateList}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                ...styles.templateItem,
                ...(selectedTemplate?.id === template.id
                  ? styles.templateItemActive
                  : {}),
              }}
              onClick={() => selectTemplate(template)}
            >
              <div style={styles.templateName}>{template.name}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(template.id);
                }}
                style={styles.deleteButton}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.editorContainer}>
        {selectedTemplate || isEditing ? (
          <>
            <div style={styles.header}>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={styles.nameInput}
                placeholder="Nom du template"
              />
            </div>
            <DragDropCanvas
              initialConfig={
                selectedTemplate
                  ? JSON.parse(selectedTemplate.config || '{}')
                  : {}
              }
              onSave={handleSave}
            />
          </>
        ) : (
          <div style={styles.emptyState}>
            <p>Sélectionnez un template ou créez-en un nouveau</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  createButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '15px',
    fontSize: '14px',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  templateItem: {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  templateItemActive: {
    backgroundColor: '#e8f5e9',
    borderLeft: '3px solid #4CAF50',
  },
  templateName: {
    fontSize: '14px',
    flex: 1,
  },
  deleteButton: {
    width: '24px',
    height: '24px',
    border: 'none',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: '1',
  },
  editorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  nameInput: {
    fontSize: '20px',
    fontWeight: 'bold',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    width: '100%',
    maxWidth: '400px',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '16px',
  },
};

export default TemplateEditor;
