import React from 'react';

const ElementProperties = ({ element, onUpdate, onDelete, csvColumns }) => {
  if (!element) return null;

  const renderTextProperties = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Colonne CSV:</label>
        <select
          value={element.csvColumn || ''}
          onChange={(e) => onUpdate({ csvColumn: e.target.value })}
          style={styles.select}
        >
          <option value="">-- Sélectionner --</option>
          {csvColumns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Police:</label>
        <select
          value={element.fontFamily || 'Arial'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          style={styles.select}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Taille: {element.fontSize}px</label>
        <input
          type="range"
          min="8"
          max="72"
          value={element.fontSize || 14}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          style={styles.range}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Couleur:</label>
        <input
          type="color"
          value={element.color || '#000000'}
          onChange={(e) => onUpdate({ color: e.target.value })}
          style={styles.colorInput}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Style:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() =>
              onUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })
            }
            style={{
              ...styles.toggleBtn,
              ...(element.fontWeight === 'bold' ? styles.toggleBtnActive : {}),
            }}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() =>
              onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })
            }
            style={{
              ...styles.toggleBtn,
              ...(element.fontStyle === 'italic' ? styles.toggleBtnActive : {}),
            }}
          >
            <em>I</em>
          </button>
        </div>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Alignement:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => onUpdate({ textAlign: 'left' })}
            style={{
              ...styles.toggleBtn,
              ...(element.textAlign === 'left' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬅
          </button>
          <button
            onClick={() => onUpdate({ textAlign: 'center' })}
            style={{
              ...styles.toggleBtn,
              ...(element.textAlign === 'center' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬌
          </button>
          <button
            onClick={() => onUpdate({ textAlign: 'right' })}
            style={{
              ...styles.toggleBtn,
              ...(element.textAlign === 'right' ? styles.toggleBtnActive : {}),
            }}
          >
            ➡
          </button>
        </div>
      </div>

      <div style={styles.group}>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={element.wordWrap !== false}
            onChange={(e) => onUpdate({ wordWrap: e.target.checked })}
          />
          Retour à la ligne automatique
        </label>
      </div>
    </>
  );

  const renderImageProperties = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Colonne CSV (référence):</label>
        <select
          value={element.csvColumn || ''}
          onChange={(e) => onUpdate({ csvColumn: e.target.value })}
          style={styles.select}
        >
          <option value="">-- Sélectionner --</option>
          {csvColumns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>URL de base:</label>
        <input
          type="text"
          value={element.baseUrl || ''}
          onChange={(e) => onUpdate({ baseUrl: e.target.value })}
          placeholder="https://cdn.example.com/products/"
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Extension:</label>
        <input
          type="text"
          value={element.extension || '.jpg'}
          onChange={(e) => onUpdate({ extension: e.target.value })}
          placeholder=".jpg"
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Ajustement:</label>
        <select
          value={element.fit || 'contain'}
          onChange={(e) => onUpdate({ fit: e.target.value })}
          style={styles.select}
        >
          <option value="contain">Contenir</option>
          <option value="cover">Couvrir</option>
          <option value="fill">Remplir</option>
        </select>
      </div>
    </>
  );

  const renderPositionAndSize = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Position X:</label>
        <input
          type="number"
          value={Math.round(element.x || 0)}
          onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Position Y:</label>
        <input
          type="number"
          value={Math.round(element.y || 0)}
          onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Largeur:</label>
        <input
          type="number"
          value={Math.round(element.width || 0)}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Hauteur:</label>
        <input
          type="number"
          value={Math.round(element.height || 0)}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
          style={styles.input}
        />
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>Propriétés</h4>
        <button onClick={onDelete} style={styles.deleteBtn}>
          🗑️
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.typeLabel}>
          Type: {element.type === 'text' ? '📝 Texte' : element.type === 'logo' ? '🖼️ Logo' : element.type === 'image' ? '📷 Image' : element.type === 'line' ? '➖ Ligne' : '▭ Rectangle'}
        </div>

        {renderPositionAndSize()}

        {element.type === 'text' && renderTextProperties()}
        {element.type === 'image' && renderImageProperties()}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    borderBottom: '1px solid #ddd',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  typeLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '8px',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333',
  },
  input: {
    padding: '6px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '3px',
  },
  select: {
    padding: '6px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '3px',
  },
  range: {
    width: '100%',
  },
  colorInput: {
    width: '100%',
    height: '35px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '5px',
  },
  toggleBtn: {
    flex: 1,
    padding: '6px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  toggleBtnActive: {
    backgroundColor: '#2196F3',
    color: 'white',
    borderColor: '#2196F3',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default ElementProperties;
