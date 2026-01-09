import React from 'react';

const PAGE_FORMATS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Custom: { width: null, height: null },
};

const PageConfigPanel = ({ config, onComplete, onBack }) => {
  const [format, setFormat] = React.useState(config.format);
  const [orientation, setOrientation] = React.useState(config.orientation);
  const [width, setWidth] = React.useState(config.width || 210);
  const [height, setHeight] = React.useState(config.height || 297);

  const handleContinue = () => {
    onComplete({
      format,
      orientation,
      width: format === 'Custom' ? parseFloat(width) : null,
      height: format === 'Custom' ? parseFloat(height) : null,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Étape 2: Configuration de la page</h3>

        <div style={styles.section}>
          <label style={styles.label}>Format de page:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={styles.select}
          >
            <option value="A4">A4 (210 x 297 mm)</option>
            <option value="A5">A5 (148 x 210 mm)</option>
            <option value="Letter">Letter (215.9 x 279.4 mm)</option>
            <option value="Custom">Personnalisé</option>
          </select>
        </div>

        {format === 'Custom' && (
          <div style={styles.customDimensions}>
            <div style={styles.dimInput}>
              <label style={styles.label}>Largeur (mm):</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.dimInput}>
              <label style={styles.label}>Hauteur (mm):</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
        )}

        <div style={styles.section}>
          <label style={styles.label}>Orientation:</label>
          <div style={styles.orientationButtons}>
            <button
              onClick={() => setOrientation('portrait')}
              style={{
                ...styles.orientationBtn,
                ...(orientation === 'portrait' ? styles.orientationBtnActive : {}),
              }}
            >
              📄 Portrait
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              style={{
                ...styles.orientationBtn,
                ...(orientation === 'landscape' ? styles.orientationBtnActive : {}),
              }}
            >
              📃 Paysage
            </button>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={onBack} style={styles.btnSecondary}>
            ← Retour
          </button>
          <button onClick={handleContinue} style={styles.btnPrimary}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '500px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '24px',
    marginBottom: '30px',
    color: '#333',
  },
  section: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  customDimensions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '25px',
  },
  dimInput: {
    display: 'flex',
    flexDirection: 'column',
  },
  orientationButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  orientationBtn: {
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '5px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  orientationBtnActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
    color: '#2196F3',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
  },
  btnPrimary: {
    padding: '10px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  btnSecondary: {
    padding: '10px 24px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default PageConfigPanel;
