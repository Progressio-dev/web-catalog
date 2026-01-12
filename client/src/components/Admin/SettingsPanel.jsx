import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    product_image_base_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Paramètres sauvegardés');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Paramètres globaux (optionnels)</h2>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Images Produits (repli)</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            URL de base pour les images produits
          </label>
          <input
            type="url"
            value={settings.product_image_base_url || ''}
            onChange={(e) => handleChange('product_image_base_url', e.target.value)}
            placeholder="https://cdn.example.com/products/"
            style={styles.input}
          />
          <p style={styles.hint}>
            Les blocs images peuvent maintenant définir leur propre URL de page, sélecteur CSS et attribut pour scrapper l'image.
            Cette URL de base reste un filet de sécurité si aucun scraping dédié n'est configuré (construction: {settings.product_image_base_url || '<URL_BASE>'}{'<reference>.jpg'}).
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Exemple de construction d'URL</h3>
        <div style={styles.exampleBox}>
          <p style={styles.exampleLabel}>URL de base:</p>
          <code style={styles.code}>{settings.product_image_base_url || 'https://cdn.example.com/products/'}</code>
          
          <p style={styles.exampleLabel}>Référence produit:</p>
          <code style={styles.code}>REF-12345</code>
          
          <p style={styles.exampleLabel}>URL finale:</p>
          <code style={styles.code}>
            {settings.product_image_base_url || 'https://cdn.example.com/products/'}REF-12345.jpg
          </code>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {}),
          }}
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '30px',
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
    fontStyle: 'italic',
  },
  exampleBox: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  exampleLabel: {
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '10px',
    marginBottom: '5px',
    color: '#666',
  },
  code: {
    display: 'block',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '3px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#333',
    overflowX: 'auto',
  },
  actions: {
    marginTop: '30px',
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default SettingsPanel;
