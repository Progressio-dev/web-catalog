import React, { useState, useEffect } from 'react';
import { logoAPI } from '../../services/api';
import { toast } from 'react-toastify';

const LogoManager = () => {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await logoAPI.getAll();
      setLogos(response.data);
    } catch (error) {
      console.error('Error fetching logos:', error);
      toast.error('Erreur lors du chargement des logos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = prompt('Nom du logo:', file.name);
    if (!name) return;

    setUploading(true);
    try {
      await logoAPI.create(file, name);
      toast.success('Logo uploadé avec succès');
      fetchLogos();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await logoAPI.update(id, { is_active: currentStatus ? 0 : 1 });
      toast.success('Logo mis à jour');
      fetchLogos();
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce logo ?')) {
      return;
    }

    try {
      await logoAPI.delete(id);
      toast.success('Logo supprimé');
      fetchLogos();
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Gestion des Logos</h2>
      <div style={styles.uploadSection}>
        <label style={styles.uploadButton}>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={styles.fileInput}
          />
          {uploading ? 'Upload en cours...' : '+ Ajouter un logo'}
        </label>
      </div>
      <div style={styles.logoGrid}>
        {logos.map((logo) => (
          <div key={logo.id} style={styles.logoCard}>
            <div style={styles.logoImageContainer}>
              <img
                src={logo.path}
                alt={logo.name}
                style={styles.logoImage}
              />
            </div>
            <div style={styles.logoInfo}>
              <h3 style={styles.logoName}>{logo.name}</h3>
              <div style={styles.logoActions}>
                <button
                  onClick={() => handleToggleActive(logo.id, logo.is_active)}
                  style={{
                    ...styles.actionButton,
                    backgroundColor: logo.is_active ? '#4CAF50' : '#999',
                  }}
                >
                  {logo.is_active ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => handleDelete(logo.id)}
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#f44336',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
        {logos.length === 0 && (
          <div style={styles.emptyState}>
            Aucun logo disponible. Uploadez-en un pour commencer.
          </div>
        )}
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
  uploadSection: {
    marginBottom: '30px',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  fileInput: {
    display: 'none',
  },
  logoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  logoCard: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logoImageContainer: {
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: '20px',
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  logoInfo: {
    padding: '15px',
  },
  logoName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  logoActions: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '16px',
  },
};

export default LogoManager;
