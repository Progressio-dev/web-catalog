import React from 'react';
import api from '../../../services/api';

// Helper function to escape regex special characters
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generic token patterns (defined once, reused)
const GENERIC_PATTERNS = [
  [/{{\s*value\s*}}/gi, 'VALUE'],
  [/{\s*value\s*}/gi, 'VALUE'],
  [/%VALUE%/gi, 'VALUE'],
  [/%REFERENCE%/gi, 'VALUE'],
  [/%REF%/gi, 'VALUE'],
  [/%s/gi, 'VALUE'],
];

// Helper function to parse HTML and extract CSS selector
const parseHtmlToSelector = (htmlString) => {
  if (!htmlString || !htmlString.trim()) return '';
  
  // Check if input looks like HTML (contains < and >)
  if (!htmlString.includes('<') || !htmlString.includes('>')) {
    return htmlString.trim(); // Return as-is if not HTML
  }
  
  try {
    // Extract tag name
    const tagMatch = htmlString.match(/<(\w+)/);
    if (!tagMatch) return htmlString.trim();
    
    const tagName = tagMatch[1];
    
    // Extract class attribute
    const classMatch = htmlString.match(/class=["']([^"']+)["']/);
    const classes = classMatch ? classMatch[1].split(/\s+/) : [];
    
    // Extract id attribute
    const idMatch = htmlString.match(/id=["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : null;
    
    // Build selector - use first class for simplicity
    // (using all classes would make selectors overly specific)
    let selector = tagName;
    
    if (classes.length > 0) {
      // Use the first class for the selector
      selector = `${tagName}.${classes[0]}`;
    } else if (id) {
      selector = `${tagName}#${id}`;
    }
    
    return selector;
  } catch (error) {
    console.error('Error parsing HTML to selector:', error);
    return htmlString.trim();
  }
};

const ElementProperties = ({ element, onUpdate, onDelete, csvColumns, availableFonts = [], pageSize, sampleData }) => {
  if (!element) return null;

  // State for real-time image URL preview
  const [previewImageUrl, setPreviewImageUrl] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(null);
  const [imageLoadError, setImageLoadError] = React.useState(false);

  const fonts = availableFonts.length > 0
    ? availableFonts
    : ['Arial', 'Times New Roman', 'Helvetica', 'Courier New', 'Georgia'];
  const tokenExampleString = '{value}, {{value}}, %VALUE%, %REFERENCE%, %REF%, %{COLONNE}%';

  // Helper function to render advanced typography controls
  const renderTypographyControls = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Interlignage: {element.lineHeight || 1.2}</label>
        <input
          type="range"
          min="0.8"
          max="3"
          step="0.1"
          value={element.lineHeight || 1.2}
          onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) })}
          style={styles.range}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Espacement des lettres: {element.letterSpacing || 0}px</label>
        <input
          type="range"
          min="-2"
          max="10"
          step="0.5"
          value={element.letterSpacing || 0}
          onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) })}
          style={styles.range}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Transformation du texte:</label>
        <select
          value={element.textTransform || 'none'}
          onChange={(e) => onUpdate({ textTransform: e.target.value })}
          style={styles.select}
        >
          <option value="none">Normal</option>
          <option value="uppercase">MAJUSCULES</option>
          <option value="lowercase">minuscules</option>
          <option value="capitalize">Première Lettre En Majuscule</option>
        </select>
      </div>
    </>
  );

  // Effect to fetch real-time image preview for image elements
  React.useEffect(() => {
    // Only run for image elements with sample data
    if (element.type !== 'image' || !sampleData) {
      setPreviewImageUrl(null);
      setPreviewError(null);
      setImageLoadError(false);
      return;
    }

    // Need at least a CSV column and page URL template to fetch
    if (!element.csvColumn || !element.pageUrlTemplate) {
      setPreviewImageUrl(null);
      setPreviewError(null);
      setImageLoadError(false);
      return;
    }

    const refValue = sampleData[element.csvColumn];
    if (!refValue) {
      setPreviewImageUrl(null);
      setPreviewError('Aucune valeur dans la colonne CSV pour la première ligne');
      setImageLoadError(false);
      return;
    }

    // Fetch the image URL
    const fetchImagePreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      setImageLoadError(false);

      console.log('🔍 [Image Preview Debug] Fetching image URL with config:', {
        refValue,
        csvColumn: element.csvColumn,
        pageUrlTemplate: element.pageUrlTemplate,
        imageSelector: element.imageSelector,
        imageAttribute: element.imageAttribute,
        urlEncodeValue: element.urlEncodeValue,
        baseUrl: element.baseUrl,
        extension: element.extension
      });

      try {
        const response = await api.get(`/product-image/${encodeURIComponent(refValue)}`, {
          params: {
            pageUrlTemplate: element.pageUrlTemplate,
            imageSelector: element.imageSelector,
            imageAttribute: element.imageAttribute,
            urlEncodeValue: element.urlEncodeValue !== false && element.urlEncodeValue !== 'false',
            csvColumn: element.csvColumn,
            baseUrl: element.baseUrl,
            extension: element.extension
          }
        });

        console.log('✅ [Image Preview Debug] Image URL fetched successfully:', response.data.imageUrl);
        setPreviewImageUrl(response.data.imageUrl);
        setPreviewError(null);
      } catch (error) {
        console.error('❌ [Image Preview Debug] Error fetching image:', error);
        const errorMsg = error.response?.data?.error || 'Erreur lors de la récupération de l\'image';
        setPreviewError(errorMsg);
        setPreviewImageUrl(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchImagePreview();
  }, [
    element.type,
    element.csvColumn,
    element.pageUrlTemplate,
    element.imageSelector,
    element.imageAttribute,
    element.urlEncodeValue,
    element.baseUrl,
    element.extension,
    sampleData
  ]);

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

      {renderTypographyControls()}

      <div style={styles.group}>
        <label style={styles.label}>Alignement horizontal:</label>
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
        <label style={styles.label}>Alignement vertical:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => onUpdate({ verticalAlign: 'top' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'top' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬆
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'middle' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'middle' ? styles.toggleBtnActive : {}),
            }}
          >
            ↕
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'bottom' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'bottom' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬇
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
        <label style={styles.label}>URL (page ou image) avec variable CSV:</label>
        <input
          type="text"
          value={element.pageUrlTemplate || ''}
          onChange={(e) => onUpdate({ pageUrlTemplate: e.target.value })}
          placeholder="https://www.exemple.com/article/%REFERENCE%"
          style={styles.input}
        />
        <p style={styles.hint}>
          Tokens possibles: <code>{tokenExampleString}</code>. Les colonnes avec espaces sont supportées (ex: %CODE PRODUIT% ou %CODE_PRODUIT%). Laissez le sélecteur vide si l'URL cible déjà l'image finale.
        </p>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Sélecteur CSS de l'image / zone (div) (optionnel):</label>
        <textarea
          value={element.imageSelector || ''}
          onChange={(e) => {
            // Allow user to type freely
            onUpdate({ imageSelector: e.target.value });
          }}
          onBlur={(e) => {
            // On blur, auto-detect if input is HTML and extract selector
            const value = e.target.value;
            const selector = parseHtmlToSelector(value);
            if (selector !== value) {
              onUpdate({ imageSelector: selector });
            }
          }}
          placeholder="Ex: .photoItem img ou collez le HTML: <img class='photoItem' src='...'>"
          style={{ ...styles.input, resize: 'vertical', minHeight: '60px', fontFamily: 'monospace', fontSize: '12px' }}
          rows={3}
        />
        <p style={styles.hint}>
          Vous pouvez coller directement le code HTML de l'image (ex: <code>&lt;img class="photoItem" src="..."&gt;</code>). 
          Lorsque vous quittez le champ, le sélecteur CSS sera extrait automatiquement (ex: <code>img.photoItem</code>).
          Sinon, entrez directement un sélecteur CSS (ex: <code>.photoItem img</code>). 
          Laisser vide si l'URL ci-dessus pointe directement vers l'image.
        </p>
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
            checked={element.urlEncodeValue !== false && element.urlEncodeValue !== 'false'}
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

      {/* Advanced Image Transformations */}
      <div style={styles.sectionHeader}>
        <strong>🎨 Transformations avancées</strong>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Rotation: {element.rotation || 0}°</label>
        <input
          type="range"
          min="0"
          max="360"
          step="15"
          value={element.rotation || 0}
          onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
          style={styles.range}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Recadrage (Crop):</label>
        <div style={styles.cropControls}>
          <div style={styles.cropRow}>
            <label style={styles.cropLabel}>Haut: {element.cropTop || 0}%</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={element.cropTop || 0}
              onChange={(e) => onUpdate({ cropTop: parseInt(e.target.value) })}
              style={styles.range}
            />
          </div>
          <div style={styles.cropRow}>
            <label style={styles.cropLabel}>Bas: {element.cropBottom || 0}%</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={element.cropBottom || 0}
              onChange={(e) => onUpdate({ cropBottom: parseInt(e.target.value) })}
              style={styles.range}
            />
          </div>
          <div style={styles.cropRow}>
            <label style={styles.cropLabel}>Gauche: {element.cropLeft || 0}%</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={element.cropLeft || 0}
              onChange={(e) => onUpdate({ cropLeft: parseInt(e.target.value) })}
              style={styles.range}
            />
          </div>
          <div style={styles.cropRow}>
            <label style={styles.cropLabel}>Droite: {element.cropRight || 0}%</label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={element.cropRight || 0}
              onChange={(e) => onUpdate({ cropRight: parseInt(e.target.value) })}
              style={styles.range}
            />
          </div>
        </div>
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Forme de masque:</label>
        <select
          value={element.maskShape || 'none'}
          onChange={(e) => onUpdate({ maskShape: e.target.value })}
          style={styles.select}
        >
          <option value="none">Aucun</option>
          <option value="circle">Cercle</option>
          <option value="ellipse">Ellipse</option>
          <option value="rounded">Coins arrondis</option>
        </select>
      </div>

      {element.maskShape === 'rounded' && (
        <div style={styles.group}>
          <label style={styles.label}>Rayon des coins: {element.borderRadius || 0}px</label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={element.borderRadius || 0}
            onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
            style={styles.range}
          />
        </div>
      )}

      {/* Real-time Image URL Preview */}
      {sampleData && element.csvColumn && (
        <div style={styles.previewSection}>
          <label style={styles.label}>Aperçu temps réel (1ère ligne CSV):</label>
          <div style={styles.previewBox}>
            {previewLoading ? (
              <div style={styles.previewLoading}>
                <span>🔄 Chargement de l'image...</span>
              </div>
            ) : previewError ? (
              <div style={styles.previewError}>
                <span>⚠️ {previewError}</span>
              </div>
            ) : previewImageUrl ? (
              <div>
                <div style={styles.previewUrlBox}>
                  <strong>URL détectée:</strong>
                  <div style={styles.previewUrl}>
                    <a href={previewImageUrl} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
                      {previewImageUrl}
                    </a>
                  </div>
                </div>
                <div style={styles.previewImageContainer}>
                  {!imageLoadError ? (
                    <img 
                      src={previewImageUrl} 
                      alt="Preview" 
                      style={styles.previewImage}
                      onError={(e) => {
                        console.error('❌ [Image Preview Debug] Failed to load image:', previewImageUrl);
                        setImageLoadError(true);
                      }}
                      onLoad={() => {
                        console.log('✅ [Image Preview Debug] Image loaded successfully');
                      }}
                    />
                  ) : (
                    <div style={{ color: '#f44336', padding: '10px' }}>
                      ❌ Impossible de charger l'image
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.previewInfo}>
                <span>ℹ️ Configurez la colonne CSV et l'URL du template pour voir l'aperçu</span>
              </div>
            )}
          </div>
        </div>
      )}
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

      {renderTypographyControls()}

      <div style={styles.group}>
        <label style={styles.label}>Alignement horizontal:</label>
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
        <label style={styles.label}>Alignement vertical:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => onUpdate({ verticalAlign: 'top' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'top' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬆
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'middle' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'middle' ? styles.toggleBtnActive : {}),
            }}
          >
            ↕
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'bottom' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'bottom' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬇
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

      {renderTypographyControls()}

      <div style={styles.group}>
        <label style={styles.label}>Alignement horizontal:</label>
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
        <label style={styles.label}>Alignement vertical:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => onUpdate({ verticalAlign: 'top' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'top' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬆
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'middle' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'middle' ? styles.toggleBtnActive : {}),
            }}
          >
            ↕
          </button>
          <button
            onClick={() => onUpdate({ verticalAlign: 'bottom' })}
            style={{
              ...styles.toggleBtn,
              ...(element.verticalAlign === 'bottom' ? styles.toggleBtnActive : {}),
            }}
          >
            ⬇
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

  const renderTableProperties = () => {
    const columns = element.columns || [];

    const handleAddColumn = () => {
      const newColumn = {
        csvColumn: '',
        label: '',
        width: null, // Auto width
      };
      onUpdate({ columns: [...columns, newColumn] });
    };

    const handleRemoveColumn = (index) => {
      const newColumns = columns.filter((_, i) => i !== index);
      onUpdate({ columns: newColumns });
    };

    const handleUpdateColumn = (index, updates) => {
      const newColumns = columns.map((col, i) => 
        i === index ? { ...col, ...updates } : col
      );
      onUpdate({ columns: newColumns });
    };

    return (
      <>
        <div style={styles.group}>
          <label style={styles.label}>Colonnes du tableau:</label>
          {columns.map((col, idx) => (
            <div key={idx} style={{ 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '8px',
              backgroundColor: '#f9f9f9' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <strong style={{ fontSize: '12px' }}>Colonne {idx + 1}</strong>
                <button
                  onClick={() => handleRemoveColumn(idx)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
              <select
                value={col.csvColumn || ''}
                onChange={(e) => handleUpdateColumn(idx, { csvColumn: e.target.value })}
                style={{ ...styles.select, marginBottom: '5px' }}
              >
                <option value="">Sélectionner une colonne CSV</option>
                {csvColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Étiquette de l'en-tête (optionnel)"
                value={col.label || ''}
                onChange={(e) => handleUpdateColumn(idx, { label: e.target.value })}
                style={styles.input}
              />
            </div>
          ))}
          <button
            onClick={handleAddColumn}
            style={{
              ...styles.button,
              backgroundColor: '#4CAF50',
              color: 'white',
              width: '100%',
              marginTop: '5px',
            }}
          >
            + Ajouter une colonne
          </button>
        </div>

        <div style={styles.group}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={element.showHeaders || false}
              onChange={(e) => onUpdate({ showHeaders: e.target.checked })}
            />
            <span>Afficher les en-têtes</span>
          </label>
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Taille du texte: {element.fontSize || 10}px</label>
          <input
            type="range"
            min="6"
            max="20"
            value={element.fontSize || 10}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            style={styles.range}
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
      </>
    );
  };

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

      <div style={styles.group}>
        <label style={styles.label}>Transparence: {Math.round((element.opacity ?? 1) * 100)}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((element.opacity ?? 1) * 100)}
          onChange={(e) => {
            const percentValue = parseInt(e.target.value);
            onUpdate({ opacity: percentValue / 100 });
          }}
          style={styles.range}
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Position Z (ordre des couches):</label>
        <input
          type="number"
          value={element.zIndex ?? 0}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
            onUpdate({ zIndex: isNaN(value) ? 0 : value });
          }}
          style={styles.input}
          placeholder="0"
        />
        <p style={styles.hint}>
          Valeur plus élevée = au-dessus. Par défaut: 0
        </p>
      </div>
    </>
  );

  const renderCommonCustomizationOptions = () => (
    <>
      <div style={styles.group}>
        <label style={styles.label}>Couleur de fond du bloc:</label>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => onUpdate({ blockBackgroundTransparent: !element.blockBackgroundTransparent })}
            style={{
              ...styles.toggleBtn,
              ...(element.blockBackgroundTransparent ? styles.toggleBtnActive : {}),
            }}
          >
            Transparent
          </button>
        </div>
        {!element.blockBackgroundTransparent && (
          <input
            type="color"
            value={element.blockBackgroundColor || '#FFFFFF'}
            onChange={(e) => onUpdate({ blockBackgroundColor: e.target.value })}
            style={{...styles.colorInput, marginTop: '8px'}}
          />
        )}
      </div>

      {/* Show highlight options only for text-based elements */}
      {(element.type === 'text' || element.type === 'freeText' || element.type === 'jsCode') && (
        <div style={styles.group}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={element.highlightEnabled || false}
              onChange={(e) => onUpdate({ highlightEnabled: e.target.checked })}
            />
            Texte surligné
          </label>
          {element.highlightEnabled && (
            <>
              <label style={{...styles.label, marginTop: '8px'}}>Couleur de surbrillance:</label>
              <input
                type="color"
                value={element.highlightColor || '#FFFF00'}
                onChange={(e) => onUpdate({ highlightColor: e.target.value })}
                style={styles.colorInput}
              />
            </>
          )}
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
          Type: {element.type === 'text' ? '📝 Texte' : element.type === 'logo' ? '🖼️ Logo' : element.type === 'image' ? '📷 Image' : element.type === 'line' ? '➖ Ligne' : element.type === 'freeText' ? '📝 Texte Libre' : element.type === 'jsCode' ? '💻 Code JavaScript' : element.type === 'table' ? '📊 Tableau' : element.type === 'group' ? '📦 Groupe' : '▭ Rectangle'}
        </div>

        {renderPositionAndSize()}

        {element.type === 'text' && renderTextProperties()}
        {element.type === 'image' && renderImageProperties()}
        {element.type === 'freeText' && renderFreeTextProperties()}
        {element.type === 'jsCode' && renderJsCodeProperties()}
        {element.type === 'table' && renderTableProperties()}

        {/* Common customization options for all block types */}
        {renderCommonCustomizationOptions()}
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
  previewSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #dee2e6',
  },
  previewBox: {
    marginTop: '10px',
  },
  previewLoading: {
    padding: '15px',
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  previewError: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    color: '#856404',
  },
  previewInfo: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196F3',
    borderRadius: '4px',
    color: '#1976d2',
  },
  previewUrlBox: {
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  previewUrl: {
    marginTop: '5px',
    wordBreak: 'break-all',
    fontSize: '11px',
  },
  urlLink: {
    color: '#2196F3',
    textDecoration: 'underline',
  },
  previewImageContainer: {
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    objectFit: 'contain',
  },
  sectionHeader: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '15px',
    marginBottom: '10px',
    paddingBottom: '5px',
    borderBottom: '1px solid #ddd',
  },
  cropControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cropRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cropLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#555',
  },
};

export default ElementProperties;
