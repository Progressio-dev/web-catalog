import React from 'react';

const ElementProperties = ({ element, onUpdate, onDelete, csvColumns, availableFonts = [], pageSize }) => {
  if (!element) return null;

  const fonts = availableFonts.length > 0
    ? availableFonts
    : ['Arial', 'Times New Roman', 'Helvetica', 'Courier New', 'Georgia'];

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
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
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

      {/* Préfixe/Suffixe pour champs CSV */}
      {element.csvColumn && (
        <>
          <div style={styles.group}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={element.hasTextModifier || false}
                onChange={(e) => onUpdate({ hasTextModifier: e.target.checked })}
              />
              Ajouter du texte au champ
            </label>
          </div>

          {element.hasTextModifier && (
            <>
              <div style={styles.group}>
                <label style={styles.label}>Texte avant (préfixe):</label>
                <input
                  type="text"
                  value={element.textPrefix || ''}
                  onChange={(e) => onUpdate({ textPrefix: e.target.value })}
                  placeholder='Ex: "Fournisseur : "'
                  style={styles.input}
                />
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Texte après (suffixe):</label>
                <input
                  type="text"
                  value={element.textSuffix || ''}
                  onChange={(e) => onUpdate({ textSuffix: e.target.value })}
                  placeholder='Ex: " (fournisseur)"'
                  style={styles.input}
                />
              </div>
            </>
          )}
        </>
      )}
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
        <label style={styles.label}>URL de la page produit (template):</label>
        <input
          type="text"
        value={element.pageUrlTemplate || ''}
        onChange={(e) => onUpdate({ pageUrlTemplate: e.target.value })}
        placeholder="https://www.exemple.com/article/{{value}}"
        style={styles.input}
      />
      <p style={styles.hint}>
          Utilisez <code>{'{value}'}</code> ou <code>{'{{value}}'}</code> pour insérer la valeur CSV. L'URL sera visitée pour récupérer l'image.
      </p>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Sélecteur CSS de l'image / zone (div):</label>
        <input
          type="text"
          value={element.imageSelector || ''}
          onChange={(e) => onUpdate({ imageSelector: e.target.value })}
          placeholder=".photoItem img"
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Attribut d'image:</label>
        <input
          type="text"
          value={element.imageAttribute || 'src'}
          onChange={(e) => onUpdate({ imageAttribute: e.target.value })}
          placeholder="src ou data-src"
          style={styles.input}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={element.urlEncodeValue !== false}
            onChange={(e) => onUpdate({ urlEncodeValue: e.target.checked })}
          />
          Encoder la valeur CSV dans l'URL
        </label>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>URL de base (repli):</label>
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

  const renderFreeTextProperties = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Contenu:</label>
        <textarea
          value={element.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={3}
          style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Entrez votre texte libre..."
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Police:</label>
        <select
          value={element.fontFamily || 'Arial'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          style={styles.select}
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
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
    </>
  );

  const renderJsCodeProperties = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Code JavaScript:</label>
        <textarea
          value={element.code || ''}
          onChange={(e) => onUpdate({ code: e.target.value })}
          rows={8}
          style={{ ...styles.input, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
          placeholder='return new Date().toLocaleDateString("fr-FR");'
        />
      </div>

      <div style={styles.codeHelp}>
        <strong style={{ fontSize: '12px' }}>Variables disponibles:</strong>
        <ul style={{ fontSize: '11px', margin: '5px 0', paddingLeft: '20px' }}>
          <li><code>data.*</code> : Colonnes CSV (ex: data.FOURNISSEUR)</li>
          <li><code>new Date()</code> : Date du jour</li>
          <li><code>await fetch()</code> : Appels API (CORS requis)</li>
        </ul>
        <div style={{ 
          padding: '8px', 
          backgroundColor: '#fff3cd', 
          borderLeft: '3px solid #ffc107', 
          marginTop: '8px',
          fontSize: '11px',
          color: '#856404'
        }}>
          ⚠️ <strong>Attention:</strong> Le code s'exécute côté serveur et client. 
          Évitez les boucles infinies et les appels API non autorisés.
        </div>
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
        <label style={styles.label}>Police:</label>
        <select
          value={element.fontFamily || 'Arial'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          style={styles.select}
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
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

      {pageSize && (
        <div style={styles.group}>
          <label style={styles.label}>Aligner le bloc:</label>
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => {
                if (!pageSize?.width) return;
                const centeredX = Math.max(0, ((pageSize.width || 0) - (element.width || 0)) / 2);
                onUpdate({ x: centeredX });
              }}
              style={styles.toggleBtn}
            >
              Centrer horizontalement
            </button>
            <button
              type="button"
              onClick={() => {
                if (!pageSize?.height) return;
                const centeredY = Math.max(0, ((pageSize.height || 0) - (element.height || 0)) / 2);
                onUpdate({ y: centeredY });
              }}
              style={styles.toggleBtn}
            >
              Centrer verticalement
            </button>
          </div>
        </div>
      )}
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
          Type: {element.type === 'text' ? '📝 Texte' : element.type === 'logo' ? '🖼️ Logo' : element.type === 'image' ? '📷 Image' : element.type === 'line' ? '➖ Ligne' : element.type === 'freeText' ? '📝 Texte Libre' : element.type === 'jsCode' ? '💻 Code JavaScript' : '▭ Rectangle'}
        </div>

        {renderPositionAndSize()}

        {element.type === 'text' && renderTextProperties()}
        {element.type === 'image' && renderImageProperties()}
        {element.type === 'freeText' && renderFreeTextProperties()}
        {element.type === 'jsCode' && renderJsCodeProperties()}
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
  codeHelp: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
    fontSize: '12px',
  },
  hint: {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
  },
};

export default ElementProperties;
