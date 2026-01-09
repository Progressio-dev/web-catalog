import React, { useState } from 'react';
import TemplateSelector from '../components/User/TemplateSelector';
import CsvUpload from '../components/User/CsvUpload';
import ProductSelection from '../components/User/ProductSelection';
import PdfGenerator from '../components/User/PdfGenerator';

/**
 * New Home page with step-by-step workflow
 * Step 1: Select template
 * Step 2: Upload CSV
 * Step 3: Select products
 * Step 4: Generate PDF
 */
const HomeNew = () => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleTemplateSelected = (template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleDataLoaded = (data) => {
    setCsvData(data);
    setStep(3);
  };

  const handleSelectionChange = (selectedIndexes) => {
    const items = selectedIndexes.map((index) => csvData.data[index]);
    setSelectedItems(items);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTemplate(null);
    setCsvData(null);
    setSelectedItems([]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Web Catalog</h1>
        <p style={styles.subtitle}>Générateur de fiches produits PDF</p>
        <a href="/admin" style={styles.adminLink}>
          Administration →
        </a>
      </header>

      {/* Progress indicator */}
      <div style={styles.progressBar}>
        <div style={styles.progressSteps}>
          {[1, 2, 3, 4].map((num, index) => (
            <React.Fragment key={num}>
              {index > 0 && <div style={styles.progressLine} />}
              <div style={{ ...styles.progressStep, ...(step >= num ? styles.progressStepActive : {}) }}>
                <span style={{ ...styles.progressNumber, ...(step >= num ? styles.progressNumberActive : {}) }}>
                  {num}
                </span>
                <span style={styles.progressLabel}>
                  {num === 1 ? 'Template' : num === 2 ? 'CSV' : num === 3 ? 'Sélection' : 'Génération'}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <main style={styles.main}>
        {step === 1 && <TemplateSelector onTemplateSelected={handleTemplateSelected} />}

        {step === 2 && (
          <div style={styles.stepContainer}>
            <button onClick={handleBack} style={styles.backButton}>
              ← Retour
            </button>
            <CsvUpload
              onDataLoaded={handleDataLoaded}
              separator={selectedTemplate?.csv_separator || ','}
            />
          </div>
        )}

        {step === 3 && csvData && (
          <div style={styles.stepContainer}>
            <div style={styles.stepHeader}>
              <button onClick={handleBack} style={styles.backButton}>
                ← Retour
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={selectedItems.length === 0}
                style={{
                  ...styles.continueButton,
                  ...(selectedItems.length === 0 ? styles.continueButtonDisabled : {}),
                }}
              >
                Continuer →
              </button>
            </div>
            <ProductSelection
              data={csvData.data}
              template={selectedTemplate}
              onSelectionChange={handleSelectionChange}
              onPreviewRow={() => {}}
            />
          </div>
        )}

        {step === 4 && (
          <div style={styles.stepContainer}>
            <button onClick={handleBack} style={styles.backButton}>
              ← Retour
            </button>
            <div style={styles.generationContainer}>
              <h2>Générer le PDF</h2>
              <div style={styles.info}>
                <p><strong>Template:</strong> {selectedTemplate?.name}</p>
                <p><strong>Produits:</strong> {selectedItems.length}</p>
              </div>
              <PdfGenerator
                selectedItems={selectedItems}
                templateId={selectedTemplate?.id}
              />
              <button onClick={handleReset} style={styles.resetButton}>
                Recommencer
              </button>
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>© 2024 Progressio - Web Catalog</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center',
    position: 'relative',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
  },
  adminLink: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 16px',
    border: '1px solid white',
    borderRadius: '5px',
  },
  progressBar: {
    backgroundColor: 'white',
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  progressNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  progressNumberActive: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#666',
  },
  progressLine: {
    width: '60px',
    height: '2px',
    backgroundColor: '#e0e0e0',
    margin: '0 8px',
  },
  main: {
    flex: 1,
    padding: '20px',
  },
  stepContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  continueButton: {
    padding: '10px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  generationContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '40px',
  },
  info: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  resetButton: {
    width: '100%',
    marginTop: '20px',
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
  },
};

export default HomeNew;
