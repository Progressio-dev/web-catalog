import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { csvAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CsvUpload = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setIsLoading(true);
    try {
      const response = await csvAPI.upload(file);
      toast.success(`${response.data.count} références chargées avec succès`);
      onDataLoaded(response.data);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Erreur lors du chargement du fichier CSV');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>1. Importer le fichier CSV</h2>
      <div
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneDragging : {}),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <p>Chargement en cours...</p>
        ) : (
          <>
            <p style={styles.dropText}>
              Glissez-déposez votre fichier CSV ici
            </p>
            <p style={styles.orText}>ou</p>
            <label style={styles.fileLabel}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                style={styles.fileInput}
              />
              <span style={styles.button}>Parcourir les fichiers</span>
            </label>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  dropZone: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  dropZoneDragging: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  dropText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px',
  },
  orText: {
    fontSize: '14px',
    color: '#999',
    margin: '15px 0',
  },
  fileLabel: {
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  button: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
};

export default CsvUpload;
