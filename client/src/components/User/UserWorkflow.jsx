import React, { useState } from 'react';
import Step1TemplateSelector from './Step1TemplateSelector';
import Step2CsvUpload from './Step2CsvUpload';
import Step3ProductSelection from './Step3ProductSelection';
import Step4PdfGeneration from './Step4PdfGeneration';

/**
 * UserWorkflow - Main orchestrator for the user-facing PDF generation workflow
 * Guides users through 4 steps: Template → CSV → Selection → PDF
 */
const UserWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleTemplateSelected = (template) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };

  const handleCsvUploaded = (data, file) => {
    setCsvData(data);
    setCsvFile(file);
    setCurrentStep(3);
  };

  const handleRowsSelected = (rows) => {
    setSelectedRows(rows);
  };

  const handleGeneratePdf = () => {
    setCurrentStep(4);
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setSelectedTemplate(null);
    setCsvData(null);
    setCsvFile(null);
    setSelectedRows([]);
  };

  const handleBackToSelection = () => {
    setCurrentStep(3);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🖨️ Générateur de Fiches PDF</h1>
          <p style={styles.subtitle}>Créez vos fiches produits professionnelles en 4 étapes</p>
        </div>
        <a href="/admin" style={styles.adminLink}>
          ⚙️ Administration
        </a>
      </header>

      {/* Progress Steps */}
      <div style={styles.progressBar}>
        <div style={styles.progressSteps}>
          <div style={{ ...styles.progressStep, ...(currentStep >= 1 ? styles.progressStepActive : {}) }}>
            <div style={styles.stepNumber}>1</div>
            <span>Template</span>
          </div>
          <div style={styles.progressLine} />
          <div style={{ ...styles.progressStep, ...(currentStep >= 2 ? styles.progressStepActive : {}) }}>
            <div style={styles.stepNumber}>2</div>
            <span>CSV</span>
          </div>
          <div style={styles.progressLine} />
          <div style={{ ...styles.progressStep, ...(currentStep >= 3 ? styles.progressStepActive : {}) }}>
            <div style={styles.stepNumber}>3</div>
            <span>Sélection</span>
          </div>
          <div style={styles.progressLine} />
          <div style={{ ...styles.progressStep, ...(currentStep >= 4 ? styles.progressStepActive : {}) }}>
            <div style={styles.stepNumber}>4</div>
            <span>PDF</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {currentStep === 1 && (
          <Step1TemplateSelector onTemplateSelected={handleTemplateSelected} />
        )}
        {currentStep === 2 && (
          <Step2CsvUpload
            template={selectedTemplate}
            onCsvUploaded={handleCsvUploaded}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3ProductSelection
            template={selectedTemplate}
            csvData={csvData}
            selectedRows={selectedRows}
            onRowsSelected={handleRowsSelected}
            onGeneratePdf={handleGeneratePdf}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4PdfGeneration
            template={selectedTemplate}
            csvData={csvData}
            selectedRows={selectedRows}
            onRestart={handleRestart}
            onBackToSelection={handleBackToSelection}
          />
        )}
      </main>

      {/* Footer */}
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
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '30px 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
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
    transition: 'background-color 0.3s',
  },
  progressBar: {
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  progressSteps: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#999',
  },
  progressStepActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid currentColor',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  progressLine: {
    width: '80px',
    height: '2px',
    backgroundColor: '#ddd',
    margin: '0 10px',
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: '30px 20px',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
  },
};

export default UserWorkflow;
