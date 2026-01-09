import React, { useState, useEffect } from 'react';
import CsvUploader from './TemplateBuilder/CsvUploader';
import PageConfigPanel from './TemplateBuilder/PageConfigPanel';
import ElementPalette from './TemplateBuilder/ElementPalette';
import TemplateCanvas from './TemplateBuilder/TemplateCanvas';
import ElementProperties from './TemplateBuilder/ElementProperties';
import TemplatePreview from './TemplateBuilder/TemplatePreview';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * TemplateBuilder - Main orchestrator component for template creation
 * Workflow: CSV Upload → Page Config → Drag & Drop → Preview → Save
 */
const TemplateBuilder = ({ template, onSave, onCancel }) => {
  const [step, setStep] = useState(template ? 2 : 1); // Skip CSV upload if editing
  const [csvData, setCsvData] = useState(null);
  const [pageConfig, setPageConfig] = useState({
    format: template?.page_format || 'A4',
    orientation: template?.page_orientation || 'portrait',
    width: template?.page_width || null,
    height: template?.page_height || null,
    backgroundColor: template?.background_color || '#FFFFFF',
  });
  const [csvSeparator, setCsvSeparator] = useState(template?.csv_separator || ',');
  const [elements, setElements] = useState(
    template?.config ? (JSON.parse(template.config).elements || []) : []
  );
  const [selectedElement, setSelectedElement] = useState(null);
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [saving, setSaving] = useState(false);
  const [isEditMode] = useState(!!template);

  // Extract CSV test data if saved in config
  React.useEffect(() => {
    if (template?.config) {
      try {
        const config = JSON.parse(template.config);
        if (config.csvTestData) {
          setCsvData({
            columns: Object.keys(config.csvTestData[0] || {}),
            preview: config.csvTestData,
          });
        }
      } catch (error) {
        console.error('Error parsing template config:', error);
      }
    }
  }, [template]);

  const handleCsvUploaded = (data) => {
    setCsvData(data);
    setStep(2);
  };

  const handlePageConfigComplete = (config) => {
    setPageConfig(config);
    setStep(3);
  };

  const handleAddElement = (element) => {
    const newElement = {
      ...element,
      id: `element_${Date.now()}`,
      x: 50,
      y: 50 + (elements.length * 30),
    };
    setElements([...elements, newElement]);
  };

  const handleUpdateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleDeleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
  };

  // Sync selectedElement with latest element data when elements change
  useEffect(() => {
    if (selectedElement) {
      const latestElement = elements.find(el => el.id === selectedElement.id);
      // Only update if the element data has actually changed to prevent loops
      if (latestElement && latestElement !== selectedElement) {
        setSelectedElement(latestElement);
      }
    }
  }, [elements, selectedElement]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Veuillez entrer un nom pour le template');
      return;
    }

    setSaving(true);
    try {
      // Save CSV test data in config for later editing
      const csvTestData = csvData?.preview ? csvData.preview.slice(0, 5) : null;
      const config = { 
        elements, 
        backgroundColor: pageConfig.backgroundColor,
        csvTestData, // Save first 5 rows for preview during editing
      };
      
      const payload = {
        name: templateName,
        config: JSON.stringify(config),
        page_format: pageConfig.format,
        page_orientation: pageConfig.orientation,
        page_width: pageConfig.format === 'Custom' ? pageConfig.width : null,
        page_height: pageConfig.format === 'Custom' ? pageConfig.height : null,
        csv_separator: csvSeparator,
        background_color: pageConfig.backgroundColor,
      };

      if (template?.id) {
        // Edit mode - use PUT
        await api.put(`/templates/${template.id}`, payload);
        toast.success('Template mis à jour avec succès');
      } else {
        // Create mode - use POST
        await api.post('/templates', payload);
        toast.success('Template créé avec succès');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Erreur lors de la sauvegarde du template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header with progress indicator */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          {isEditMode ? `Modifier le template: ${templateName}` : 'Créer un nouveau template'}
        </h2>
        <div style={styles.steps}>
          <div style={{ ...styles.step, ...(step >= 1 ? styles.stepActive : {}) }}>
            1. CSV
          </div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.step, ...(step >= 2 ? styles.stepActive : {}) }}>
            2. Format
          </div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.step, ...(step >= 3 ? styles.stepActive : {}) }}>
            3. Édition
          </div>
        </div>
      </div>

      {/* Step 1: CSV Upload */}
      {step === 1 && (
        <CsvUploader
          onCsvUploaded={handleCsvUploaded}
          separator={csvSeparator}
          onSeparatorChange={setCsvSeparator}
        />
      )}

      {/* Step 2: Page Configuration */}
      {step === 2 && (
        <div>
          {isEditMode && !csvData && (
            <div style={styles.editModeNotice}>
              <p>ℹ️ Mode édition: Pour voir l'aperçu avec vos données, uploadez à nouveau un fichier CSV de test.</p>
              <button onClick={() => setStep(1)} style={styles.btnSecondary}>
                ← Charger un CSV de test
              </button>
            </div>
          )}
          <PageConfigPanel
            config={pageConfig}
            onComplete={handlePageConfigComplete}
            onBack={() => setStep(1)}
          />
        </div>
      )}

      {/* Step 3: Template Builder */}
      {step === 3 && (
        <div style={styles.builder}>
          {/* Left sidebar - Element Palette (30%) */}
          <div style={styles.sidebar}>
            <ElementPalette
              csvColumns={csvData?.columns || []}
              onAddElement={handleAddElement}
            />
          </div>

          {/* Center - Canvas (40%) */}
          <div style={styles.canvasContainer}>
            <div style={styles.canvasHeader}>
              <input
                type="text"
                placeholder="Nom du template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={styles.nameInput}
              />
              <div style={styles.actions}>
                <button onClick={() => setStep(2)} style={styles.btnSecondary}>
                  ← Retour
                </button>
                <button onClick={onCancel} style={styles.btnSecondary}>
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  style={styles.btnPrimary}
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            <TemplateCanvas
              pageConfig={pageConfig}
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
            />
          </div>

          {/* Right sidebar - Properties & Preview (30%) */}
          <div style={styles.rightSidebar}>
            {selectedElement ? (
              <ElementProperties
                element={selectedElement}
                onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                onDelete={() => handleDeleteElement(selectedElement.id)}
                csvColumns={csvData?.columns || []}
              />
            ) : (
              <div style={styles.noSelection}>
                <p>Cliquez sur un élément pour le configurer</p>
              </div>
            )}

            {csvData && csvData.preview && csvData.preview.length > 0 && (
              <TemplatePreview
                elements={elements}
                pageConfig={pageConfig}
                sampleData={csvData.preview[0]}
                allSampleData={csvData.preview}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  title: {
    fontSize: '24px',
    marginBottom: '15px',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  step: {
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: '#e0e0e0',
    color: '#666',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  stepActive: {
    backgroundColor: '#2196F3',
    color: 'white',
  },
  stepLine: {
    width: '40px',
    height: '2px',
    backgroundColor: '#e0e0e0',
  },
  builder: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '30%',
    minWidth: '250px',
    maxWidth: '350px',
    backgroundColor: 'white',
    borderRight: '1px solid #ddd',
    overflow: 'auto',
  },
  canvasContainer: {
    width: '40%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  canvasHeader: {
    backgroundColor: 'white',
    padding: '15px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameInput: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    width: '300px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  btnPrimary: {
    padding: '8px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  btnSecondary: {
    padding: '8px 20px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  rightSidebar: {
    width: '30%',
    minWidth: '300px',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderLeft: '1px solid #ddd',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  noSelection: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
  },
  editModeNotice: {
    padding: '20px',
    margin: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    textAlign: 'center',
  },
};

export default TemplateBuilder;
