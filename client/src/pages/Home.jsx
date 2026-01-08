import React, { useState } from 'react';
import CsvUpload from '../components/User/CsvUpload';
import ProductList from '../components/User/ProductList';
import LogoSelector from '../components/User/LogoSelector';
import FieldToggle from '../components/User/FieldToggle';
import PdfGenerator from '../components/User/PdfGenerator';

const Home = () => {
  const [csvData, setCsvData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [visibleFields, setVisibleFields] = useState([]);

  const handleDataLoaded = (data) => {
    setCsvData(data);
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

      <main style={styles.main}>
        <CsvUpload onDataLoaded={handleDataLoaded} />

        {csvData && (
          <>
            <ProductList
              data={csvData.data}
              onSelectionChange={setSelectedItems}
            />

            <div style={styles.configSection}>
              <LogoSelector onLogoChange={setSelectedLogo} />
              <FieldToggle
                fields={csvData.fields}
                onFieldsChange={setVisibleFields}
              />
            </div>

            <PdfGenerator
              selectedItems={selectedItems}
              logoId={selectedLogo}
              visibleFields={visibleFields}
            />
          </>
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
    transition: 'background-color 0.3s',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '30px 20px',
  },
  configSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
  },
};

export default Home;
