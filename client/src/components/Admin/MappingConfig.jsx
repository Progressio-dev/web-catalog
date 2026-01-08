import React, { useState, useEffect } from 'react';
import { templateAPI, mappingAPI } from '../../services/api';
import { toast } from 'react-toastify';

const MappingConfig = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [csvFields, setCsvFields] = useState(['reference', 'designation', 'prix', 'description']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchMappings(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const response = await templateAPI.getAll();
      setTemplates(response.data);
      if (response.data.length > 0) {
        setSelectedTemplate(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async (templateId) => {
    try {
      const response = await mappingAPI.get(templateId);
      setMappings(response.data);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast.error('Erreur lors du chargement des mappings');
    }
  };

  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      { csv_field: '', pdf_zone: '' },
    ]);
  };

  const handleUpdateMapping = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const handleRemoveMapping = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedTemplate) {
      toast.error('Veuillez sélectionner un template');
      return;
    }

    try {
      await mappingAPI.save(selectedTemplate.id, mappings);
      toast.success('Mappings sauvegardés');
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Configuration des Mappings CSV ↔ PDF</h2>
      
      <div style={styles.templateSelector}>
        <label style={styles.label}>Template :</label>
        <select
          value={selectedTemplate?.id || ''}
          onChange={(e) => {
            const template = templates.find(t => t.id === parseInt(e.target.value));
            setSelectedTemplate(template);
          }}
          style={styles.select}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.mappingsContainer}>
        <h3 style={styles.subtitle}>Mappings</h3>
        {mappings.map((mapping, index) => (
          <div key={index} style={styles.mappingRow}>
            <select
              value={mapping.csv_field}
              onChange={(e) => handleUpdateMapping(index, 'csv_field', e.target.value)}
              style={styles.mappingSelect}
            >
              <option value="">Champ CSV</option>
              {csvFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
            <span style={styles.arrow}>→</span>
            <input
              type="text"
              value={mapping.pdf_zone}
              onChange={(e) => handleUpdateMapping(index, 'pdf_zone', e.target.value)}
              placeholder="Zone PDF (ID de l'élément)"
              style={styles.mappingInput}
            />
            <button
              onClick={() => handleRemoveMapping(index)}
              style={styles.removeButton}
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={handleAddMapping} style={styles.addButton}>
          + Ajouter un mapping
        </button>
      </div>

      <div style={styles.actions}>
        <button onClick={handleSave} style={styles.saveButton}>
          Enregistrer les mappings
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  templateSelector: {
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
  },
  select: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    minWidth: '200px',
  },
  mappingsContainer: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  mappingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  mappingSelect: {
    flex: 1,
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  arrow: {
    fontSize: '20px',
    color: '#4CAF50',
  },
  mappingInput: {
    flex: 1,
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  removeButton: {
    width: '30px',
    height: '30px',
    border: 'none',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: '1',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default MappingConfig;
