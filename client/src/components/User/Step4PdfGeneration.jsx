import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Step4PdfGeneration - PDF generation with progress tracking
 */
const Step4PdfGeneration = ({ template, csvData, selectedRows, onRestart, onBackToSelection }) => {
  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    generatePdf();
  }, []);

  const generatePdf = async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
        setCurrentItem(prev => Math.min(prev + 1, selectedRows.length));
      }, 200);

      // Prepare selected data
      const selectedData = selectedRows.map(index => csvData[index]);

      // Call PDF generation API
      const response = await api.post(
        '/generate-pdf',
        {
          templateId: template.id,
          selectedRows: selectedData,
          multiPage: true,
        },
        {
          responseType: 'blob',
        }
      );

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentItem(selectedRows.length);

      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fiches-${template.name}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setGenerating(false);
      setSuccess(true);
      toast.success(`PDF généré avec succès ! (${selectedRows.length} fiches)`);
    } catch (error) {
      console.error('PDF generation error:', error);
      setGenerating(false);
      setError(error.response?.data?.error || 'Erreur lors de la génération du PDF');
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.modal}>
        {generating && (
          <>
            <div style={styles.spinner}>⏳</div>
            <h2 style={styles.title}>Génération de votre PDF...</h2>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`,
                }}
              />
            </div>
            <p style={styles.progressText}>
              Génération de la fiche {currentItem} / {selectedRows.length}...
            </p>
            <p style={styles.percentage}>{progress}%</p>
          </>
        )}

        {error && (
          <>
            <div style={styles.errorIcon}>❌</div>
            <h2 style={styles.title}>Erreur</h2>
            <p style={styles.errorMessage}>{error}</p>
            <div style={styles.actions}>
              <button onClick={generatePdf} style={styles.btnRetry}>
                🔄 Réessayer
              </button>
              <button onClick={onBackToSelection} style={styles.btnBack}>
                ← Retour à la sélection
              </button>
            </div>
          </>
        )}

        {success && (
          <>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.title}>PDF généré avec succès !</h2>
            <p style={styles.successMessage}>
              Votre PDF contenant {selectedRows.length} fiche{selectedRows.length > 1 ? 's' : ''} a été téléchargé.
            </p>
            <div style={styles.actions}>
              <button onClick={onRestart} style={styles.btnRestart}>
                🔄 Recommencer
              </button>
              <button onClick={onBackToSelection} style={styles.btnAnother}>
                Générer un autre PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  spinner: {
    fontSize: '64px',
    marginBottom: '20px',
    animation: 'spin 2s linear infinite',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#f0f0f0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px',
  },
  percentage: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  errorMessage: {
    fontSize: '16px',
    color: '#f44336',
    marginBottom: '30px',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  successMessage: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },
  btnRetry: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
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
  btnRestart: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnAnother: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Step4PdfGeneration;
