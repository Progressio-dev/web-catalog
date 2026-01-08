import React, { useState, useEffect } from 'react';

const ProductList = ({ data, onSelectionChange }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    onSelectionChange(selectedItems);
  }, [selectedItems]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...data]);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (item) => {
    const index = selectedItems.findIndex(
      (i) => JSON.stringify(i) === JSON.stringify(item)
    );
    if (index >= 0) {
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const isSelected = (item) => {
    return selectedItems.some((i) => JSON.stringify(i) === JSON.stringify(item));
  };

  if (!data || data.length === 0) {
    return null;
  }

  const fields = Object.keys(data[0]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>2. Sélectionner les références</h2>
      <div style={styles.selectAllContainer}>
        <label style={styles.selectAllLabel}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            style={styles.checkbox}
          />
          Tout sélectionner ({data.length} références)
        </label>
        <span style={styles.selectedCount}>
          {selectedItems.length} sélectionnée(s)
        </span>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              {fields.slice(0, 5).map((field) => (
                <th key={field} style={styles.th}>
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                style={{
                  ...styles.tr,
                  ...(isSelected(item) ? styles.trSelected : {}),
                }}
                onClick={() => handleSelectItem(item)}
              >
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    checked={isSelected(item)}
                    onChange={() => handleSelectItem(item)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {fields.slice(0, 5).map((field) => (
                  <td key={field} style={styles.td}>
                    {item[field]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  selectAllContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  selectedCount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#4CAF50',
    color: 'white',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  trSelected: {
    backgroundColor: '#e8f5e9',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #ddd',
  },
};

export default ProductList;
