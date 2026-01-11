import React, { useState, useEffect } from 'react';
import { logoAPI } from '../../../services/api';
import { toast } from 'react-toastify';

const ElementPalette = ({ csvColumns, onAddElement }) => {
  const [logos, setLogos] = useState([]);
  const [selectedLogoId, setSelectedLogoId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await logoAPI.getAll();
      setLogos(response.data.filter(logo => logo.is_active));
    } catch (error) {
      console.error('Error fetching logos:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = prompt('Nom du logo:', file.name);
    if (!name) return;

    setUploadingLogo(true);
    try {
      await logoAPI.create(file, name);
      toast.success('Logo uploadé avec succès');
      await fetchLogos();
      setShowLogoUpload(false);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const addTextElement = (column) => {
    onAddElement({
      type: 'text',
      csvColumn: column,
      width: 80,  // mm (was 200px / 2.5 = 80mm)
      height: 12, // mm (was 30px / 2.5 = 12mm)
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      wordWrap: true,
    });
  };

  const addLogoElement = () => {
    if (!selectedLogoId) {
      toast.warning('Veuillez sélectionner un logo');
      return;
    }

    const selectedLogo = logos.find(logo => logo.id === parseInt(selectedLogoId));
    onAddElement({
      type: 'logo',
      logoId: selectedLogoId,
      logoPath: selectedLogo?.path || '',
      width: 60,  // mm (was 150px / 2.5 = 60mm)
      height: 20, // mm (was 50px / 2.5 = 20mm)
    });
  };

  const addImageElement = () => {
    onAddElement({
      type: 'image',
      csvColumn: null,
      baseUrl: '',
      extension: '.jpg',
      width: 80,  // mm (was 200px / 2.5 = 80mm)
      height: 80, // mm (was 200px / 2.5 = 80mm)
      fit: 'contain',
    });
  };

  const addLineElement = () => {
    onAddElement({
      type: 'line',
      width: 120, // mm (was 300px / 2.5 = 120mm)
      height: 0.8, // mm (was 2px / 2.5 = 0.8mm)
      thickness: 1,
      color: '#000000',
      style: 'solid',
    });
  };

  const addRectangleElement = () => {
    onAddElement({
      type: 'rectangle',
      width: 80,  // mm (was 200px / 2.5 = 80mm)
      height: 40, // mm (was 100px / 2.5 = 40mm)
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      borderRadius: 0,
    });
  };

  const addFreeTextElement = () => {
    onAddElement({
      type: 'freeText',
      width: 80,  // mm (was 200px / 2.5 = 80mm)
      height: 16, // mm (was 40px / 2.5 = 16mm)
      content: 'Texte libre',
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
    });
  };

  const addJsCodeElement = () => {
    onAddElement({
      type: 'jsCode',
      width: 120, // mm (was 300px / 2.5 = 120mm)
      height: 16, // mm (was 40px / 2.5 = 16mm)
      code: 'return new Date().toLocaleDateString("fr-FR");',
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Colonnes CSV</h4>
        <div style={styles.columnList}>
          {csvColumns.map((column) => (
            <div
              key={column}
              style={styles.columnItem}
              onClick={() => addTextElement(column)}
              title="Cliquez pour ajouter"
            >
              <span style={styles.icon}>📝</span>
              <span style={styles.columnName}>{column}</span>
            </div>
          ))}
          {csvColumns.length === 0 && (
            <p style={styles.emptyText}>Aucune colonne CSV détectée</p>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Logo</h4>
        <div style={styles.logoSection}>
          <label style={styles.uploadButton}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              style={styles.fileInput}
            />
            <span style={styles.icon}>📤</span>
            <span>{uploadingLogo ? 'Upload...' : '+ Upload Logo'}</span>
          </label>
          
          {logos.length > 0 && (
            <>
              <select
                value={selectedLogoId || ''}
                onChange={(e) => setSelectedLogoId(e.target.value)}
                style={styles.logoSelect}
              >
                <option value="">Sélectionner un logo</option>
                {logos.map((logo) => (
                  <option key={logo.id} value={logo.id}>
                    {logo.name}
                  </option>
                ))}
              </select>
              
              <button 
                onClick={addLogoElement} 
                style={{
                  ...styles.elementBtn,
                  opacity: selectedLogoId ? 1 : 0.5,
                }}
                disabled={!selectedLogoId}
              >
                <span style={styles.icon}>🖼️</span>
                <span>Ajouter au canvas</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Éléments spéciaux</h4>
        <div style={styles.specialElements}>
          <button onClick={addFreeTextElement} style={styles.elementBtn}>
            <span style={styles.icon}>📝</span>
            <span>Texte Libre</span>
          </button>
          <button onClick={addJsCodeElement} style={styles.elementBtn}>
            <span style={styles.icon}>💻</span>
            <span>Code JavaScript</span>
          </button>
          <button onClick={addImageElement} style={styles.elementBtn}>
            <span style={styles.icon}>📷</span>
            <span>Image produit</span>
          </button>
          <button onClick={addLineElement} style={styles.elementBtn}>
            <span style={styles.icon}>➖</span>
            <span>Ligne</span>
          </button>
          <button onClick={addRectangleElement} style={styles.elementBtn}>
            <span style={styles.icon}>▭</span>
            <span>Rectangle</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
  },
  section: {
    marginBottom: '25px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  columnList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  columnItem: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  icon: {
    fontSize: '16px',
  },
  columnName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  specialElements: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  elementBtn: {
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  uploadButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: '600',
    justifyContent: 'center',
  },
  fileInput: {
    display: 'none',
  },
  logoSelect: {
    padding: '10px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
  },
};

export default ElementPalette;
