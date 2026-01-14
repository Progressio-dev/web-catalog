import React, { useEffect, useMemo, useRef, useState } from 'react';
import CsvUploader from './TemplateBuilder/CsvUploader';
import PageConfigPanel from './TemplateBuilder/PageConfigPanel';
import ElementPalette from './TemplateBuilder/ElementPalette';
import TemplateCanvas from './TemplateBuilder/TemplateCanvas';
import ElementProperties from './TemplateBuilder/ElementProperties';
import TemplatePreview from './TemplateBuilder/TemplatePreview';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { migrateTemplateConfig, getCurrentSchemaVersion } from '../../utils/templateMigrations';

/**
 * TemplateBuilder - Main orchestrator component for template creation
 * Workflow: CSV Upload → Page Config → Drag & Drop → Preview → Save
 */
const TemplateBuilder = ({ template, onSave, onCancel }) => {
  const parsedConfig = useMemo(() => {
    if (!template?.config) return null;
    try {
      const config = JSON.parse(template.config);
      // Apply migrations automatically
      return migrateTemplateConfig(config, {
        page_format: template.page_format,
        page_orientation: template.page_orientation,
        page_width: template.page_width,
        page_height: template.page_height,
      });
    } catch (error) {
      console.error('Error parsing template config:', error);
      return null;
    }
  }, [template]);

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
  const [customFonts, setCustomFonts] = useState(() => parsedConfig?.customFonts || []);
  
  // Page format definitions (in mm)
  const PAGE_FORMATS = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 },
  };
  
  // Migration helper: convert legacy px values to mm
  // Uses smarter detection based on page dimensions
  const migratePxToMm = (elements, pageFormat, orientation, customWidth, customHeight, alreadyMigrated = false) => {
    // Skip migration if already done (check for migration flag in config)
    if (alreadyMigrated) {
      return elements;
    }
    
    // At 96 DPI: 1 inch = 96px, 1 inch = 25.4mm → 1mm = 96/25.4 ≈ 3.779528px
    const MM_TO_PX = 3.779528;
    // Detection strategy: if element dimension/position > page dimension, assume px
    // This catches typical px values (e.g., 275px = 110mm) which exceed page width (210mm)
    
    // Get page dimensions in mm
    let pageWidth = pageFormat === 'Custom' 
      ? customWidth 
      : PAGE_FORMATS[pageFormat]?.width || 210;
    let pageHeight = pageFormat === 'Custom'
      ? customHeight
      : PAGE_FORMATS[pageFormat]?.height || 297;
    
    // Apply orientation
    if (orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    
    return elements.map(element => {
      // Check if values look like they're in px by comparing to page dimensions
      // If width > pageWidth, it's likely in px (e.g., 275px > 210mm for A4)
      const widthLooksLikePx = (element.width || 0) > pageWidth;
      const heightLooksLikePx = (element.height || 0) > pageHeight;
      const xLooksLikePx = (element.x || 0) > pageWidth;
      const yLooksLikePx = (element.y || 0) > pageHeight;
      
      const needsMigration = widthLooksLikePx || heightLooksLikePx || xLooksLikePx || yLooksLikePx;
      
      if (needsMigration) {
        return {
          ...element,
          x: (element.x || 0) / MM_TO_PX,
          y: (element.y || 0) / MM_TO_PX,
          width: (element.width || 0) / MM_TO_PX,
          height: (element.height || 0) / MM_TO_PX,
        };
      }
      return element;
    });
  };

  const [elements, setElements] = useState(() => {
    return parsedConfig?.elements || [];
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]); // For multi-selection
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [saving, setSaving] = useState(false);
  const [isEditMode] = useState(!!template);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  
  // Grid and guides settings
  const [gridSettings, setGridSettings] = useState(() => 
    parsedConfig?.gridSettings || {
      enabled: false,
      size: 10, // mm
      snapToGrid: false,
      showSmartGuides: true,
    }
  );

  const BASE_FONTS = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Courier New',
    'Georgia',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Poppins',
    'Inter',
    'Source Sans Pro',
  ];
  const MAX_HISTORY = 50;

  const availableFonts = useMemo(() => {
    const customNames = (customFonts || []).map((font) => font.name);
    return Array.from(new Set([...BASE_FONTS, ...customNames]));
  }, [customFonts]);

  const pageSize = useMemo(() => {
    let width =
      pageConfig.format === 'Custom'
        ? pageConfig.width
        : PAGE_FORMATS[pageConfig.format]?.width || 210;
    let height =
      pageConfig.format === 'Custom'
        ? pageConfig.height
        : PAGE_FORMATS[pageConfig.format]?.height || 297;

    if (pageConfig.orientation === 'landscape') {
      [width, height] = [height, width];
    }
    return { width, height };
  }, [pageConfig]);

  // Extract CSV test data if saved in config
  React.useEffect(() => {
    if (parsedConfig?.csvTestData) {
      setCsvData({
        columns: Object.keys(parsedConfig.csvTestData[0] || {}),
        preview: parsedConfig.csvTestData,
      });
    }
  }, [parsedConfig]);

  useEffect(() => {
    setHistory([elements]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
  }, [template?.id]);

  useEffect(() => {
    const styleId = 'template-builder-custom-fonts';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const fontFaces = (customFonts || [])
      .map(
        (font) => `
      @font-face {
        font-family: '${font.name}';
        src: url(${font.dataUrl}) format('${font.format || 'truetype'}');
        font-weight: ${font.weight || 'normal'};
        font-style: ${font.style || 'normal'};
      }
    `
      )
      .join('\n');

    styleEl.textContent = fontFaces;

    return () => {
      if (styleEl) {
        styleEl.textContent = '';
      }
    };
  }, [customFonts]);

  const pushHistory = (nextElements) => {
    setHistory((prev) => {
      const base = prev.length ? prev : [elements];
      const trimmed = base.slice(0, historyIndexRef.current + 1);
      const updated = [...trimmed, nextElements].slice(-MAX_HISTORY);
      historyIndexRef.current = updated.length - 1;
      return updated;
    });
    setHistoryIndex(historyIndexRef.current);
  };

  const updateElements = (updater, skipHistory = false) => {
    setElements((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipHistory) {
        pushHistory(next);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    const newIndex = historyIndexRef.current - 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    const target = history[newIndex];
    if (target) {
      updateElements(target, true);
      if (selectedElement) {
        const latest = target.find((el) => el.id === selectedElement.id);
        setSelectedElement(latest || null);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= history.length - 1) return;
    const newIndex = historyIndexRef.current + 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    const target = history[newIndex];
    if (target) {
      updateElements(target, true);
      if (selectedElement) {
        const latest = target.find((el) => el.id === selectedElement.id);
        setSelectedElement(latest || null);
      }
    }
  };

  const handleCsvUploaded = (data) => {
    setCsvData(data);
    setStep(2);
  };

  const handlePageConfigComplete = (config) => {
    setPageConfig(config);
    setStep(3);
  };

  const getFontFormat = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'otf') return 'opentype';
    if (ext === 'woff') return 'woff';
    if (ext === 'woff2') return 'woff2';
    return 'truetype';
  };

  const handleFontInputChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const fontName = file.name.replace(/\.[^/.]+$/, '');
      const fontData = {
        name: fontName,
        dataUrl: reader.result,
        format: getFontFormat(file.name),
      };
      setCustomFonts((prev) => {
        const withoutDuplicate = prev.filter((font) => font.name !== fontName);
        return [...withoutDuplicate, fontData];
      });
      toast.success(`Police "${fontName}" ajoutée`);
    };
    reader.onerror = () => {
      toast.error('Erreur lors du chargement de la police');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveFont = (name) => {
    setCustomFonts((prev) => prev.filter((font) => font.name !== name));
  };

  const handleAddElement = (element) => {
    let newElement;
    updateElements((prev) => {
      newElement = {
        ...element,
        id: `element_${Date.now()}`,
        x: 20,  // mm (was 50px / 2.5 = 20mm)
        y: 20 + (prev.length * 12),  // mm (was 50 + n*30 px, now in mm)
      };
      return [...prev, newElement];
    });
    if (newElement) {
      setSelectedElement(newElement);
    }
  };

  const handleUpdateElement = (id, updates) => {
    let nextElements = [];
    updateElements((prev) => {
      nextElements = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      return nextElements;
    });
    if (selectedElement?.id === id && nextElements.length) {
      setSelectedElement(nextElements.find((el) => el.id === id) || null);
    }
  };

  const handleDeleteElement = (id) => {
    updateElements((prev) => prev.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
    setSelectedElements(prev => prev.filter(el => el.id !== id));
  };

  const handleSelectElement = (element, isMultiSelect = false) => {
    if (isMultiSelect) {
      // Multi-select mode (Ctrl/Cmd + click)
      setSelectedElements(prev => {
        const isAlreadySelected = prev.some(el => el.id === element.id);
        if (isAlreadySelected) {
          return prev.filter(el => el.id !== element.id);
        } else {
          return [...prev, element];
        }
      });
      setSelectedElement(element);
    } else {
      // Single select
      setSelectedElement(element);
      setSelectedElements([]);
    }
  };

  const handleGroupElements = () => {
    const toGroup = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (toGroup.length < 2) {
      toast.warning('Sélectionnez au moins 2 éléments pour créer un groupe');
      return;
    }

    // Calculate group bounding box
    const xs = toGroup.map(el => el.x);
    const ys = toGroup.map(el => el.y);
    const rights = toGroup.map(el => el.x + el.width);
    const bottoms = toGroup.map(el => el.y + el.height);

    const groupX = Math.min(...xs);
    const groupY = Math.min(...ys);
    const groupWidth = Math.max(...rights) - groupX;
    const groupHeight = Math.max(...bottoms) - groupY;

    // Convert absolute positions to relative within group
    const children = toGroup.map(el => ({
      ...el,
      x: el.x - groupX,
      y: el.y - groupY,
    }));

    const newGroup = {
      id: `group_${Date.now()}`,
      type: 'group',
      x: groupX,
      y: groupY,
      width: groupWidth,
      height: groupHeight,
      children,
    };

    // Remove grouped elements and add group
    updateElements(prev => {
      const filtered = prev.filter(el => !toGroup.some(g => g.id === el.id));
      return [...filtered, newGroup];
    });

    setSelectedElement(newGroup);
    setSelectedElements([]);
    toast.success('Groupe créé avec succès');
  };

  const handleUngroupElements = () => {
    if (!selectedElement || selectedElement.type !== 'group') {
      toast.warning('Sélectionnez un groupe pour le dégrouper');
      return;
    }

    const group = selectedElement;
    // Convert children's relative positions back to absolute
    const children = group.children.map(child => ({
      ...child,
      x: child.x + group.x,
      y: child.y + group.y,
    }));

    // Remove group and add children
    updateElements(prev => {
      const filtered = prev.filter(el => el.id !== group.id);
      return [...filtered, ...children];
    });

    setSelectedElement(null);
    toast.success('Groupe dissous avec succès');
  };

  const handleDuplicateElement = () => {
    const toDuplicate = selectedElement;
    if (!toDuplicate) {
      toast.warning('Sélectionnez un élément à dupliquer');
      return;
    }

    const newElement = {
      ...toDuplicate,
      id: `${toDuplicate.type}_${Date.now()}`,
      x: toDuplicate.x + 10,
      y: toDuplicate.y + 10,
    };

    updateElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
    toast.success('Élément dupliqué');
  };

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
        schemaVersion: getCurrentSchemaVersion(),
        elements, 
        backgroundColor: pageConfig.backgroundColor,
        csvTestData, // Save first 5 rows for preview during editing
        mmMigrated: true, // Mark as migrated to prevent re-migration
        customFonts,
        gridSettings, // Save grid settings
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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
                  onClick={handleUndo}
                  disabled={!canUndo}
                  style={{ ...styles.btnSecondary, ...(canUndo ? {} : styles.btnDisabled) }}
                  title="Annuler la dernière modification"
                >
                  ↺ Annuler
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  style={{ ...styles.btnSecondary, ...(canRedo ? {} : styles.btnDisabled) }}
                  title="Rétablir"
                >
                  ↻ Rétablir
                </button>
                <button
                  onClick={handleDuplicateElement}
                  disabled={!selectedElement}
                  style={{ ...styles.btnSecondary, ...(!selectedElement ? styles.btnDisabled : {}) }}
                  title="Dupliquer l'élément sélectionné"
                >
                  📋 Dupliquer
                </button>
                <button
                  onClick={handleGroupElements}
                  disabled={selectedElements.length < 2 && (!selectedElement || selectedElements.length === 0)}
                  style={{ ...styles.btnSecondary, ...((selectedElements.length < 2 && (!selectedElement || selectedElements.length === 0)) ? styles.btnDisabled : {}) }}
                  title="Grouper les éléments sélectionnés"
                >
                  📦 Grouper
                </button>
                <button
                  onClick={handleUngroupElements}
                  disabled={!selectedElement || selectedElement.type !== 'group'}
                  style={{ ...styles.btnSecondary, ...((!selectedElement || selectedElement.type !== 'group') ? styles.btnDisabled : {}) }}
                  title="Dégrouper"
                >
                  📂 Dégrouper
                </button>
                <button
                  onClick={() => setGridSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  style={{ 
                    ...styles.btnSecondary,
                    backgroundColor: gridSettings.enabled ? '#4CAF50' : undefined,
                    color: gridSettings.enabled ? 'white' : undefined,
                  }}
                  title="Afficher/masquer la grille"
                >
                  🔲 Grille
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
              selectedElements={selectedElements}
              gridSettings={gridSettings}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
            />
          </div>

          {/* Right sidebar - Properties & Preview (30%) */}
          <div style={styles.rightSidebar}>
            {/* Grid Settings Panel */}
            <div style={styles.gridPanel}>
              <h4 style={styles.panelTitle}>⚙️ Paramètres de la grille</h4>
              <div style={styles.gridOptions}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={gridSettings.enabled}
                    onChange={(e) => setGridSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span>Afficher la grille</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={gridSettings.snapToGrid}
                    onChange={(e) => setGridSettings(prev => ({ ...prev, snapToGrid: e.target.checked }))}
                    disabled={!gridSettings.enabled}
                  />
                  <span>Magnétisme (snap-to-grid)</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={gridSettings.showSmartGuides}
                    onChange={(e) => setGridSettings(prev => ({ ...prev, showSmartGuides: e.target.checked }))}
                  />
                  <span>Guides intelligents</span>
                </label>
                <label style={styles.inputLabel}>
                  <span>Taille de la grille (mm):</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={gridSettings.size}
                    onChange={(e) => setGridSettings(prev => ({ ...prev, size: parseInt(e.target.value) || 10 }))}
                    style={styles.numberInput}
                    disabled={!gridSettings.enabled}
                  />
                </label>
              </div>
            </div>

            <div style={styles.fontManager}>
              <div style={styles.fontHeader}>
                <div>
                  <div style={styles.fontTitle}>Polices</div>
                  <div style={styles.fontSubtitle}>Disponibles dans l'éditeur, l'aperçu et le PDF</div>
                </div>
                <label style={styles.fontUploadBtn}>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFontInputChange}
                    style={styles.fileInput}
                  />
                  + Ajouter
                </label>
              </div>
              <div style={styles.fontChips}>
                {availableFonts.map((font) => {
                  const isCustom = customFonts.some((f) => f.name === font);
                  return (
                    <span
                      key={font}
                      style={{ ...styles.fontChip, ...(isCustom ? styles.fontChipCustom : {}) }}
                    >
                      {font}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFont(font)}
                          style={styles.fontChipRemove}
                          title="Supprimer cette police"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {selectedElement ? (
              <ElementProperties
                element={selectedElement}
                onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                onDelete={() => handleDeleteElement(selectedElement.id)}
                csvColumns={csvData?.columns || []}
                availableFonts={availableFonts}
                pageSize={pageSize}
                sampleData={csvData?.preview?.[0]}
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
                customFonts={customFonts}
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
    display: 'grid',
    gridTemplateColumns: '150px minmax(760px, 1fr) 600px',
    width: '100%',
    overflow: 'hidden',
    minHeight: 0, // Allow grid item to shrink in vertical direction
  },
  sidebar: {
    backgroundColor: 'white',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  canvasContainer: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '760px', // Enforce minimum width to prevent crushing
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  canvasHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
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
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  rightSidebar: {
    backgroundColor: 'white',
    borderLeft: '1px solid #ddd',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  fontManager: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fafafa',
  },
  fontHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  fontTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  fontSubtitle: {
    fontSize: '12px',
    color: '#666',
  },
  fontUploadBtn: {
    padding: '6px 10px',
    backgroundColor: '#2196F3',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  fileInput: {
    display: 'none',
  },
  fontChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  fontChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#e8f0fe',
    color: '#1a73e8',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  fontChipCustom: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  fontChipRemove: {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: 1,
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
  gridPanel: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  gridOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  inputLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '13px',
  },
  numberInput: {
    padding: '5px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    width: '80px',
  },
};

export default TemplateBuilder;
