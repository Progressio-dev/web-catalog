import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

/**
 * Step2CsvUpload - CSV file upload with validation against template
 */
const Step2CsvUpload = ({ template, onCsvUploaded, onBack }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  // Extract required columns from template
  const getRequiredColumns = () => {
    if (!template?.config) return [];
    try {
      const config = JSON.parse(template.config);
      const columns = new Set();
      
      config.elements?.forEach(element => {
        if (element.csvColumn) {
          columns.add(element.csvColumn);
        }
      });
      
      return Array.from(columns);
    } catch (error) {
      console.error('Error parsing template config:', error);
      return [];
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelected(droppedFile);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelected(selectedFile);
    }
  };

  const handleFileSelected = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setFile(selectedFile);
    setValidating(true);
    
    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      delimiter: template.csv_separator || ',',
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(), // Remove BOM + trim whitespace
      complete: (results) => {
        setParsedData(results.data);
        validateCsv(results.data);
        setValidating(false);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        toast.error('Erreur lors de la lecture du fichier CSV');
        setValidating(false);
        setFile(null);
      }
    });
  };

  const validateCsv = (data) => {
    if (!data || data.length === 0) {
      setValidation({
        valid: false,
        error: 'Le fichier CSV est vide',
      });
      return;
    }

    const csvColumns = Object.keys(data[0]);
    const requiredColumns = getRequiredColumns();
    const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

    if (missingColumns.length > 0) {
      setValidation({
        valid: false,
        error: `Colonnes manquantes: ${missingColumns.join(', ')}`,
        missingColumns,
      });
    } else {
      setValidation({
        valid: true,
        rowCount: data.length,
        columns: csvColumns,
      });
    }
  };

  const handleContinue = () => {
    if (validation?.valid && parsedData) {
      onCsvUploaded(parsedData, file);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📤 Étape 2/4 - Chargez votre fichier CSV</h2>
      
      <div style={styles.templateBadge}>
        Template sélectionné: <strong>{template.name}</strong>
      </div>

      <div style={styles.uploadSection}>
        <div
          style={{
            ...styles.dropZone,
            ...(dragging ? styles.dropZoneActive : {}),
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-file-input').click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            style={styles.fileInput}
          />
          
          <div style={styles.dropZoneIcon}>📄</div>
          <p style={styles.dropZoneText}>
            {dragging
              ? 'Déposez votre fichier ici'
              : 'Glissez votre fichier CSV ici ou cliquez pour parcourir'}
          </p>
          <p style={styles.dropZoneHint}>Formats acceptés: .csv</p>
        </div>

        {template.csv_separator && (
          <div style={styles.info}>
            <strong>Séparateur attendu:</strong> {template.csv_separator === ',' ? 'Virgule (,)' : template.csv_separator === ';' ? 'Point-virgule (;)' : template.csv_separator}
          </div>
        )}

        {validating && (
          <div style={styles.validating}>
            <p>⏳ Validation en cours...</p>
          </div>
        )}

        {file && validation && (
          <div style={styles.validationResult}>
            <h3 style={styles.fileName}>📄 {file.name}</h3>
            
            {validation.valid ? (
              <div style={styles.validBox}>
                <p style={styles.successText}>✅ Fichier valide</p>
                <p><strong>Nombre de lignes:</strong> {validation.rowCount}</p>
                <p><strong>Colonnes détectées:</strong> {validation.columns?.join(', ')}</p>
              </div>
            ) : (
              <div style={styles.errorBox}>
                <p style={styles.errorText}>❌ {validation.error}</p>
                {validation.missingColumns && (
                  <p>Veuillez vérifier que votre fichier CSV contient toutes les colonnes requises par le template.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button onClick={onBack} style={styles.btnBack}>
          ← Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={!validation?.valid}
          style={{
            ...styles.btnContinue,
            ...(validation?.valid ? {} : styles.btnDisabled),
          }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  templateBadge: {
    padding: '12px 20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    marginBottom: '30px',
    fontSize: '14px',
  },
  uploadSection: {
    marginBottom: '30px',
  },
  dropZone: {
    border: '2px dashed #ddd',
    borderRadius: '10px',
    padding: '60px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    backgroundColor: 'white',
  },
  dropZoneActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  fileInput: {
    display: 'none',
  },
  dropZoneIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  dropZoneText: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#333',
  },
  dropZoneHint: {
    fontSize: '14px',
    color: '#999',
  },
  info: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginTop: '15px',
    fontSize: '14px',
  },
  validating: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '16px',
    color: '#666',
  },
  validationResult: {
    marginTop: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  fileName: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#333',
  },
  validBox: {
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    fontSize: '14px',
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  errorBox: {
    padding: '15px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    fontSize: '14px',
  },
  errorText: {
    color: '#f44336',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
  },
  btnBack: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnContinue: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default Step2CsvUpload;
