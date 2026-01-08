import React, { useState, useEffect } from 'react';

const FieldToggle = ({ fields, onFieldsChange }) => {
  const [visibleFields, setVisibleFields] = useState({});

  useEffect(() => {
    if (fields && fields.length > 0) {
      const initialFields = {};
      fields.forEach((field) => {
        initialFields[field] = true;
      });
      setVisibleFields(initialFields);
      onFieldsChange(fields);
    }
  }, [fields]);

  const handleToggle = (field) => {
    const newVisibleFields = {
      ...visibleFields,
      [field]: !visibleFields[field],
    };
    setVisibleFields(newVisibleFields);

    const activeFields = Object.keys(newVisibleFields).filter(
      (f) => newVisibleFields[f]
    );
    onFieldsChange(activeFields);
  };

  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>4. Champs à afficher</h3>
      <div style={styles.fieldsGrid}>
        {fields.map((field) => (
          <label key={field} style={styles.fieldLabel}>
            <input
              type="checkbox"
              checked={visibleFields[field] || false}
              onChange={() => handleToggle(field)}
              style={styles.checkbox}
            />
            <span style={styles.fieldName}>{field}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '3px',
    transition: 'background-color 0.2s',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  fieldName: {
    fontSize: '14px',
    color: '#333',
  },
};

export default FieldToggle;
