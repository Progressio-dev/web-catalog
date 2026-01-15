import React, { useState } from 'react';

const ProductSelection = ({ data, template, onSelectionChange, onPreviewRow }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const handleToggleRow = (index) => {
    const newSelection = selectedRows.includes(index)
      ? selectedRows.filter((i) => i !== index)
      : [...selectedRows, index];

    setSelectedRows(newSelection);
    onSelectionChange(newSelection);

    // Update preview to first selected item
    if (newSelection.length > 0 && !selectedRows.includes(index)) {
      setPreviewIndex(0);
      onPreviewRow(data[newSelection[0]]);
    }
  };

  const handleSelectAll = () => {
    const allIndexes = data.map((_, index) => index);
    setSelectedRows(allIndexes);
    onSelectionChange(allIndexes);
    if (allIndexes.length > 0) {
      setPreviewIndex(0);
      onPreviewRow(data[0]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedRows([]);
    onSelectionChange([]);
  };

  const handleNavigatePreview = (direction) => {
    if (selectedRows.length === 0) return;

    let newIndex = previewIndex + direction;
    if (newIndex < 0) newIndex = selectedRows.length - 1;
    if (newIndex >= selectedRows.length) newIndex = 0;

    setPreviewIndex(newIndex);
    onPreviewRow(data[selectedRows[newIndex]]);
  };

  // Get first few columns for display
  const displayColumns = data.length > 0 ? Object.keys(data[0]).slice(0, 4) : [];

  return (
    <div style={styles.container}>
      {/* Left column - Table */}
      <div style={styles.leftColumn}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>
            Sélection des produits ({selectedRows.length} / {data.length})
          </h3>
          <div style={styles.tableActions}>
            <button onClick={handleSelectAll} style={styles.btnSecondary}>
              ✓ Tout sélectionner
            </button>
            <button onClick={handleDeselectAll} style={styles.btnSecondary}>
              ✗ Tout désélectionner
            </button>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length}
                    onChange={() => {
                      if (selectedRows.length === data.length) {
                        handleDeselectAll();
                      } else {
                        handleSelectAll();
                      }
                    }}
                  />
                </th>
                {displayColumns.map((col) => (
                  <th key={col} style={styles.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    ...styles.tr,
                    ...(selectedRows.includes(index) ? styles.trSelected : {}),
                  }}
                  onClick={() => handleToggleRow(index)}
                >
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(index)}
                      onChange={() => handleToggleRow(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {displayColumns.map((col) => (
                    <td key={col} style={styles.td}>
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right column - Preview */}
      <div style={styles.rightColumn}>
        <div style={styles.previewHeader}>
          <h3 style={styles.previewTitle}>Aperçu</h3>
          {selectedRows.length > 0 && (
            <div style={styles.previewNav}>
              <button
                onClick={() => handleNavigatePreview(-1)}
                style={styles.navBtn}
              >
                ←
              </button>
              <span style={styles.previewCounter}>
                {previewIndex + 1} / {selectedRows.length}
              </span>
              <button
                onClick={() => handleNavigatePreview(1)}
                style={styles.navBtn}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div style={styles.previewContent}>
          {selectedRows.length === 0 ? (
            <div style={styles.previewEmpty}>
              <div style={styles.emptyIcon}>👆</div>
              <p>Sélectionnez des produits pour voir l'aperçu</p>
            </div>
          ) : (
            <div style={styles.previewCard}>
              <p style={styles.previewInfo}>
                Aperçu de la fiche avec le template sélectionné
              </p>
              {/* The actual preview is handled by parent component */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '20px',
    height: '800px',
  },
  leftColumn: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  tableActions: {
    display: 'flex',
    gap: '10px',
  },
  btnSecondary: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    fontSize: '14px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  trSelected: {
    backgroundColor: '#e3f2fd',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  previewHeader: {
    padding: '20px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  previewNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navBtn: {
    padding: '6px 12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  previewCounter: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  previewContent: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  previewEmpty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  previewCard: {
    // Preview rendering area
  },
  previewInfo: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '15px',
  },
};

export default ProductSelection;
