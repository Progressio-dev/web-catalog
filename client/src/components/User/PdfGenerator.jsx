import React, { useState } from 'react';
import { pdfAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PdfGenerator = ({ selectedItems, logoId, visibleFields }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.warning('Veuillez sélectionner au moins une référence');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await pdfAPI.generate({
        items: selectedItems,
        logoId,
        visibleFields,
      });

      // Check if response is JSON error instead of PDF
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Parse JSON error response
        const text = await response.data.text();
        const error = JSON.parse(text);
        toast.error(error.error || 'Erreur lors de la génération du PDF');
        return;
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Try to extract error message from response
      let errorMessage = 'Erreur lors de la génération du PDF';
      if (error.response?.data) {
        try {
          // If data is a Blob, try to read it as text
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const jsonError = JSON.parse(text);
            errorMessage = jsonError.error || errorMessage;
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.error || errorMessage;
          }
        } catch (e) {
          // If parsing fails, use default message
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedItems && selectedItems.length > 0;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>5. Générer le PDF</h3>
      <div style={styles.buttonContainer}>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          style={{
            ...styles.button,
            ...((!canGenerate || isGenerating) ? styles.buttonDisabled : {}),
          }}
        >
          {isGenerating ? (
            <>
              <span style={styles.spinner}></span>
              Génération en cours...
            </>
          ) : (
            `Générer PDF (${selectedItems?.length || 0} référence${
              selectedItems?.length > 1 ? 's' : ''
            })`
          )}
        </button>
      </div>
      {!canGenerate && (
        <p style={styles.hint}>
          Sélectionnez des références pour générer un PDF
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f0f8ff',
    borderRadius: '8px',
    border: '2px solid #4CAF50',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: '10px',
  },
  button: {
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #fff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
  },
};

export default PdfGenerator;
