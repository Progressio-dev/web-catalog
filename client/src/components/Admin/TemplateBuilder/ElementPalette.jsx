import React from 'react';

const ElementPalette = ({ csvColumns, onAddElement }) => {
  const addTextElement = (column) => {
    onAddElement({
      type: 'text',
      csvColumn: column,
      width: 200,
      height: 30,
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
    onAddElement({
      type: 'logo',
      logoId: null,
      width: 150,
      height: 50,
    });
  };

  const addImageElement = () => {
    onAddElement({
      type: 'image',
      csvColumn: null,
      baseUrl: '',
      extension: '.jpg',
      width: 200,
      height: 200,
      fit: 'contain',
    });
  };

  const addLineElement = () => {
    onAddElement({
      type: 'line',
      width: 300,
      height: 2,
      thickness: 1,
      color: '#000000',
      style: 'solid',
    });
  };

  const addRectangleElement = () => {
    onAddElement({
      type: 'rectangle',
      width: 200,
      height: 100,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#000000',
      borderStyle: 'solid',
      borderRadius: 0,
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
        <h4 style={styles.sectionTitle}>Éléments spéciaux</h4>
        <div style={styles.specialElements}>
          <button onClick={addLogoElement} style={styles.elementBtn}>
            <span style={styles.icon}>🖼️</span>
            <span>Logo</span>
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
};

export default ElementPalette;
