import React, { useState, useEffect } from 'react';
import { logoAPI } from '../../services/api';
import { toast } from 'react-toastify';

const LogoSelector = ({ onLogoChange }) => {
  const [logos, setLogos] = useState([]);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await logoAPI.getAll();
      setLogos(response.data);
      if (response.data.length > 0) {
        setSelectedLogo(response.data[0].id);
        onLogoChange(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
      toast.error('Erreur lors du chargement des logos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const logoId = parseInt(e.target.value);
    setSelectedLogo(logoId);
    onLogoChange(logoId);
  };

  if (loading) {
    return <div>Chargement des logos...</div>;
  }

  if (logos.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>3. Sélectionner un logo</h3>
      <div style={styles.selectorContainer}>
        <select
          value={selectedLogo || ''}
          onChange={handleLogoChange}
          style={styles.select}
        >
          <option value="">Aucun logo</option>
          {logos.map((logo) => (
            <option key={logo.id} value={logo.id}>
              {logo.name}
            </option>
          ))}
        </select>
        {selectedLogo && (
          <div style={styles.preview}>
            {logos.find((l) => l.id === selectedLogo) && (
              <img
                src={logos.find((l) => l.id === selectedLogo).path}
                alt="Logo preview"
                style={styles.previewImage}
              />
            )}
          </div>
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
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  selectorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  select: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '200px',
  },
  preview: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  previewImage: {
    maxWidth: '150px',
    maxHeight: '80px',
    objectFit: 'contain',
  },
};

export default LogoSelector;
