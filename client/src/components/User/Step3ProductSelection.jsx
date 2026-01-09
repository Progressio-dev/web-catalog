import React, { useState } from 'react';

/**
 * Step3ProductSelection - Product selection table with preview
 */
const Step3ProductSelection = ({ template, csvData, selectedRows, onRowsSelected, onGeneratePdf, onBack }) => {
  const [selectAll, setSelectAll] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleSelectAll = () => {
    if (selectAll) {
      onRowsSelected([]);
    } else {
      onRowsSelected(csvData.map((_, index) => index));
    }
    setSelectAll(!selectAll);
  };

  const handleRowToggle = (index) => {
    if (selectedRows.includes(index)) {
      onRowsSelected(selectedRows.filter(i => i !== index));
    } else {
      onRowsSelected([...selectedRows, index]);
    }
  };

  // Get key columns to display (first 3-4 most important)
  const getDisplayColumns = () => {
    if (!csvData || csvData.length === 0) return [];
    const allColumns = Object.keys(csvData[0]);
    // Prioritize common important columns
    const priority = ['reference', 'ref', 'designation', 'nom', 'prix', 'price', 'name'];
    const priorityColumns = priority.filter(col => 
      allColumns.some(c => c.toLowerCase() === col.toLowerCase())
    );
    const otherColumns = allColumns.filter(col => 
      !priorityColumns.some(p => p.toLowerCase() === col.toLowerCase())
    );
    return [...priorityColumns, ...otherColumns].slice(0, 4);
  };

  const displayColumns = getDisplayColumns();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 Étape 3/4 - Sélectionnez les produits</h2>
      
      <div style={styles.layout}>
        {/* Left Panel - Product Selection */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <label style={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                style={styles.checkbox}
              />
              <span>Tout sélectionner / Tout désélectionner</span>
            </label>
            <div style={styles.counter}>
              {selectedRows.length} fiche{selectedRows.length > 1 ? 's' : ''} sélectionnée{selectedRows.length > 1 ? 's' : ''}
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}></th>
                  {displayColumns.map(col => (
                    <th key={col} style={styles.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      ...styles.tr,
                      ...(selectedRows.includes(index) ? styles.trSelected : {}),
                    }}
                    onClick={() => {
                      handleRowToggle(index);
                      setPreviewIndex(index);
                    }}
                  >
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(index)}
                        onChange={() => handleRowToggle(index)}
                        style={styles.checkbox}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    {displayColumns.map(col => (
                      <td key={col} style={styles.td}>{row[col] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div style={styles.rightPanel}>
          <div style={styles.previewHeader}>
            <h3 style={styles.previewTitle}>👁️ Aperçu</h3>
            {selectedRows.length > 0 && (
              <div style={styles.previewNav}>
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  style={{
                    ...styles.navBtn,
                    opacity: previewIndex === 0 ? 0.5 : 1,
                  }}
                >
                  ←
                </button>
                <span style={styles.navLabel}>
                  Ligne {previewIndex + 1} / {csvData.length}
                </span>
                <button
                  onClick={() => setPreviewIndex(Math.min(csvData.length - 1, previewIndex + 1))}
                  disabled={previewIndex === csvData.length - 1}
                  style={{
                    ...styles.navBtn,
                    opacity: previewIndex === csvData.length - 1 ? 0.5 : 1,
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div style={styles.previewContent}>
            {selectedRows.length === 0 ? (
              <div style={styles.previewEmpty}>
                <p>Sélectionnez au moins une fiche pour voir l'aperçu</p>
              </div>
            ) : (
              <div style={styles.previewBox}>
                <p style={styles.previewNote}>
                  ℹ️ Aperçu simplifié de la ligne {previewIndex + 1}
                </p>
                <div style={styles.previewData}>
                  {Object.entries(csvData[previewIndex]).map(([key, value]) => (
                    <div key={key} style={styles.previewRow}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={onBack} style={styles.btnBack}>
          ← Retour
        </button>
        <button
          onClick={onGeneratePdf}
          disabled={selectedRows.length === 0}
          style={{
            ...styles.btnGenerate,
            ...(selectedRows.length === 0 ? styles.btnDisabled : {}),
          }}
        >
          Générer le PDF ({selectedRows.length})
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
  },
  layout: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    height: '600px',
  },
  leftPanel: {
    flex: '0 0 40%',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  rightPanel: {
    flex: '0 0 60%',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  counter: {
    fontSize: '14px',
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1,
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  trSelected: {
    backgroundColor: '#e3f2fd',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
  },
  checkbox: {
    cursor: 'pointer',
  },
  previewHeader: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  previewNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navBtn: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  previewContent: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  previewEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '16px',
  },
  previewBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
  },
  previewNote: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  previewData: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewRow: {
    fontSize: '14px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '5px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
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
  btnGenerate: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default Step3ProductSelection;
