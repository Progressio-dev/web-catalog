import React, { useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const CsvUploader = ({ onCsvUploaded, separator, onSeparatorChange }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const separatorOptions = [
    { value: ',', label: 'Virgule (,)' },
    { value: ';', label: 'Point-virgule (;)' },
    { value: '\t', label: 'Tabulation' },
    { value: '|', label: 'Pipe (|)' },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('separator', separator);

      const response = await api.post('/templates/analyze-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onCsvUploaded(response.data);
      toast.success(`CSV analysé: ${response.data.columns.length} colonnes détectées`);
    } catch (error) {
      console.error('CSV upload error:', error);
      toast.error('Erreur lors de l\'analyse du CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Étape 1: Upload CSV de test</h3>
        <p style={styles.cardSubtitle}>
          Ce fichier CSV sera utilisé pour détecter les colonnes et générer l'aperçu
        </p>

        {/* Separator selection */}
        <div style={styles.separatorSection}>
          <label style={styles.label}>Séparateur CSV:</label>
          <select
            value={separator}
            onChange={(e) => onSeparatorChange(e.target.value)}
            style={styles.select}
          >
            {separatorOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          style={{
            ...styles.dropZone,
            ...(dragActive ? styles.dropZoneActive : {}),
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleChange}
            style={styles.fileInput}
          />
          <label htmlFor="csv-upload" style={styles.uploadLabel}>
            <div style={styles.uploadIcon}>📄</div>
            {file ? (
              <div>
                <p style={styles.fileName}>{file.name}</p>
                <p style={styles.fileSize}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p style={styles.uploadText}>
                  Glissez-déposez votre fichier CSV ici
                </p>
                <p style={styles.uploadSubtext}>ou cliquez pour sélectionner</p>
              </div>
            )}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            ...styles.uploadButton,
            ...((!file || uploading) ? styles.uploadButtonDisabled : {}),
          }}
        >
          {uploading ? 'Analyse en cours...' : 'Analyser le CSV'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '500px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
  },
  separatorSection: {
    marginBottom: '30px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
  },
  dropZone: {
    border: '2px dashed #ddd',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
  },
  dropZoneActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  uploadText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '5px',
  },
  uploadSubtext: {
    fontSize: '14px',
    color: '#999',
  },
  fileName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  fileSize: {
    fontSize: '14px',
    color: '#666',
  },
  uploadButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default CsvUploader;
