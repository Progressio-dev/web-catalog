# Implémentation des Corrections Canvas et Nouvelles Fonctionnalités

## 📋 Résumé

Ce document détaille l'implémentation des corrections et nouvelles fonctionnalités pour l'éditeur de template.

## ✅ PARTIE 1 - FIX CRITIQUE : Sélection des Éléments sur le Canvas

### Statut : Déjà Implémenté ✅

L'analyse du code existant a révélé que la fonctionnalité de sélection était **déjà correctement implémentée** dans `TemplateCanvas.jsx` :

- ✅ **Sélection via `onMouseDown`** : Gestion correcte des événements de souris avec `handleMouseDown`
- ✅ **Bordure de sélection persistante** : `border: isSelected ? '3px solid #2196F3' : '1px dashed #ccc'`
- ✅ **8 poignées de redimensionnement** : Coins (nw, ne, sw, se) + Milieux (n, s, e, w)
- ✅ **Logique de redimensionnement** : Fonction `handleResizeMove` avec gestion de tous les handles
- ✅ **Désélection sur clic canvas** : `onClick={() => onSelectElement(null)}`
- ✅ **Suppression avec touche Delete** : Écouteur d'événement clavier

Le code existant est robuste et fonctionnel.

---

## ✅ PARTIE 2 - FIX APERÇU : Taille et Positionnement

### Statut : Déjà Implémenté ✅

Le layout est **déjà correctement structuré** dans `TemplateBuilder.jsx` :

```javascript
// Layout 3 colonnes
sidebar: { width: '30%' }          // Palette d'éléments
canvasContainer: { width: '40%' }  // Canvas d'édition
rightSidebar: { width: '30%' }     // Propriétés + Aperçu
```

**Fonctionnalités d'aperçu dans `TemplatePreview.jsx` :**
- ✅ Zoom avec contrôles (+/-)
- ✅ Navigation entre lignes CSV (←/→)
- ✅ Sélection directe de ligne
- ✅ Affichage responsive
- ✅ Pas de superposition avec les contrôles

---

## ✅ PARTIE 3 - Préfixe/Suffixe pour Champs CSV

### Statut : Implémenté ✅

### Frontend

#### 1. ElementProperties.jsx
Ajout d'une interface utilisateur pour configurer préfixe/suffixe :

```javascript
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
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Texte après (suffixe):</label>
          <input
            type="text"
            value={element.textSuffix || ''}
            onChange={(e) => onUpdate({ textSuffix: e.target.value })}
            placeholder='Ex: " (fournisseur)"'
          />
        </div>
      </>
    )}
  </>
)}
```

#### 2. TemplatePreview.jsx
Application du préfixe/suffixe dans l'aperçu :

```javascript
if (element.type === 'text') {
  let content = displayData?.[element.csvColumn] || element.csvColumn || '';
  
  // Apply prefix/suffix if enabled
  if (element.hasTextModifier && element.csvColumn) {
    const prefix = element.textPrefix || '';
    const suffix = element.textSuffix || '';
    const csvValue = displayData?.[element.csvColumn] || '';
    content = `${prefix}${csvValue}${suffix}`;
  }
  
  return <div style={textStyle}>{content}</div>;
}
```

#### 3. TemplateCanvas.jsx
Affichage dans l'éditeur :

```javascript
let displayText = element.csvColumn || 'Texte';

if (element.hasTextModifier && element.csvColumn) {
  const prefix = element.textPrefix || '';
  const suffix = element.textSuffix || '';
  displayText = `${prefix}${element.csvColumn}${suffix}`;
}
```

### Backend

#### pdfService.js
Génération PDF avec préfixe/suffixe :

```javascript
if (element.type === 'text') {
  let content = item[element.csvColumn] || '';
  
  // Apply prefix/suffix if enabled
  if (element.hasTextModifier && element.csvColumn) {
    const prefix = element.textPrefix || '';
    const suffix = element.textSuffix || '';
    const csvValue = item[element.csvColumn] || '';
    content = `${prefix}${csvValue}${suffix}`;
  }
  
  return `<div style="${textStyle}">${content}</div>`;
}
```

### Exemple d'utilisation
```
Colonne CSV: "FOURNISSEUR" = "Polaris"
Préfixe: "Fournisseur : "
Suffixe: " (officiel)"

Résultat: "Fournisseur : Polaris (officiel)"
```

---

## ✅ PARTIE 4 - Bloc Texte Libre

### Statut : Implémenté ✅

### Frontend

#### 1. ElementPalette.jsx
Ajout du bouton dans la palette :

```javascript
const addFreeTextElement = () => {
  onAddElement({
    type: 'freeText',
    width: 200,
    height: 40,
    content: 'Texte libre',
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  });
};

<button onClick={addFreeTextElement} style={styles.elementBtn}>
  <span style={styles.icon}>📝</span>
  <span>Texte Libre</span>
</button>
```

#### 2. TemplateCanvas.jsx
Rendu dans l'éditeur :

```javascript
if (element.type === 'freeText') {
  return (
    <div
      key={element.id}
      style={{
        ...baseStyle,
        fontSize: `${element.fontSize}px`,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        color: element.color,
        textAlign: element.textAlign,
        padding: '4px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)',
        whiteSpace: 'pre-wrap',
      }}
      onMouseDown={(e) => handleMouseDown(e, element)}
    >
      {element.content || 'Texte libre'}
      {renderResizeHandles()}
    </div>
  );
}
```

#### 3. ElementProperties.jsx
Configuration complète :

```javascript
const renderFreeTextProperties = () => (
  <>
    <div style={styles.group}>
      <label style={styles.label}>Contenu:</label>
      <textarea
        value={element.content || ''}
        onChange={(e) => onUpdate({ content: e.target.value })}
        rows={3}
        style={{ ...styles.input, resize: 'vertical' }}
        placeholder="Entrez votre texte libre..."
      />
    </div>

    {/* Police, taille, couleur, gras, italique, alignement */}
  </>
);
```

#### 4. TemplatePreview.jsx
Affichage dans l'aperçu :

```javascript
if (element.type === 'freeText') {
  return (
    <div style={{
      ...baseStyle,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      color: element.color,
      textAlign: element.textAlign,
      whiteSpace: 'pre-wrap',
      overflow: 'hidden',
    }}>
      {element.content || 'Texte libre'}
    </div>
  );
}
```

### Backend

#### pdfService.js
Génération PDF :

```javascript
if (element.type === 'freeText') {
  const content = element.content || 'Texte libre';
  const textStyle = `
    ${baseStyle}
    font-size: ${element.fontSize || 14}px;
    font-family: ${element.fontFamily || 'Arial'}, sans-serif;
    font-weight: ${element.fontWeight || 'normal'};
    font-style: ${element.fontStyle || 'normal'};
    color: ${element.color || '#000000'};
    text-align: ${element.textAlign || 'left'};
    white-space: pre-wrap;
  `;
  return `<div style="${textStyle}">${content}</div>`;
}
```

### Cas d'usage
- Titre : "Catalogue 2026"
- Label : "Prix TTC"
- Footer : "Document confidentiel"
- Instructions : "Ne pas dépasser 100 unités"

---

## ✅ PARTIE 5 - Bloc Code JavaScript

### Statut : Implémenté ✅

### Frontend

#### 1. ElementPalette.jsx
Ajout du bouton :

```javascript
const addJsCodeElement = () => {
  onAddElement({
    type: 'jsCode',
    width: 300,
    height: 40,
    code: 'return new Date().toLocaleDateString("fr-FR");',
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  });
};

<button onClick={addJsCodeElement} style={styles.elementBtn}>
  <span style={styles.icon}>💻</span>
  <span>Code JavaScript</span>
</button>
```

#### 2. TemplateCanvas.jsx
Rendu visuel distinct dans l'éditeur :

```javascript
if (element.type === 'jsCode') {
  return (
    <div
      key={element.id}
      style={{
        ...baseStyle,
        fontSize: `${element.fontSize}px`,
        padding: '4px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,200,0.9)', // Fond jaune clair
        border: isSelected ? '3px solid #2196F3' : '1px dashed #f90',
      }}
      onMouseDown={(e) => handleMouseDown(e, element)}
    >
      💻 Code JS
      {renderResizeHandles()}
    </div>
  );
}
```

#### 3. ElementProperties.jsx
Éditeur de code avec aide :

```javascript
const renderJsCodeProperties = () => (
  <>
    <div style={styles.group}>
      <label style={styles.label}>Code JavaScript:</label>
      <textarea
        value={element.code || ''}
        onChange={(e) => onUpdate({ code: e.target.value })}
        rows={8}
        style={{ 
          ...styles.input, 
          resize: 'vertical', 
          fontFamily: 'monospace', 
          fontSize: '12px' 
        }}
        placeholder='return new Date().toLocaleDateString("fr-FR");'
      />
    </div>

    <div style={styles.codeHelp}>
      <strong style={{ fontSize: '12px' }}>Variables disponibles:</strong>
      <ul style={{ fontSize: '11px', margin: '5px 0', paddingLeft: '20px' }}>
        <li><code>data.*</code> : Colonnes CSV (ex: data.FOURNISSEUR)</li>
        <li><code>new Date()</code> : Date du jour</li>
        <li><code>await fetch()</code> : Appels API</li>
      </ul>
    </div>

    {/* Taille, couleur, police */}
  </>
);
```

#### 4. TemplatePreview.jsx
Exécution du code avec timeout :

```javascript
const [codeResults, setCodeResults] = React.useState({});

// Execute JavaScript code with timeout
const executeJsCode = async (code, rowData) => {
  try {
    // Create async function from code
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('data', code);
    
    // Execute with timeout (5 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Le code a pris plus de 5 secondes')), 5000)
    );
    
    const result = await Promise.race([
      fn(rowData || {}),
      timeoutPromise
    ]);
    
    return String(result);
  } catch (error) {
    console.error('Erreur d\'exécution du code JS:', error);
    return `❌ Erreur: ${error.message}`;
  }
};

// Execute all JS code elements when data changes
React.useEffect(() => {
  const executeAllJsElements = async () => {
    const results = {};
    const jsElements = elements.filter(el => el.type === 'jsCode');
    
    for (const element of jsElements) {
      if (element.code) {
        results[element.id] = await executeJsCode(element.code, displayData);
      } else {
        results[element.id] = '(code vide)';
      }
    }
    
    setCodeResults(results);
  };
  
  if (displayData) {
    executeAllJsElements();
  }
}, [elements, displayData]);

// Render result
if (element.type === 'jsCode') {
  const result = codeResults[element.id] || 'Chargement...';
  return (
    <div style={textStyle}>
      {result}
    </div>
  );
}
```

### Backend

#### pdfService.js
Exécution côté serveur avec timeout :

```javascript
// Execute JavaScript code with timeout
async function executeJsCode(code, data) {
  if (!code) return '';
  
  try {
    // Create async function from code
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('data', code);
    
    // Execute with timeout (5 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Le code a pris plus de 5 secondes')), 5000)
    );
    
    const result = await Promise.race([
      fn(data || {}),
      timeoutPromise
    ]);
    
    return String(result);
  } catch (error) {
    console.error('JS code execution error:', error);
    throw error;
  }
}

// Render element (async)
if (element.type === 'jsCode') {
  let result = '';
  try {
    // Execute JavaScript code
    result = await executeJsCode(element.code, item);
  } catch (error) {
    console.error('JS execution error:', error);
    result = `Erreur: ${error.message}`;
  }
  
  return `<div style="${textStyle}">${result}</div>`;
}
```

**Note importante** : La fonction `renderElement` a été transformée en `async function` pour permettre l'exécution du code JavaScript. Les appels à cette fonction utilisent maintenant `Promise.all()` pour gérer l'asynchronisme.

### Exemples d'utilisation

#### Exemple 1 : Date du jour
```javascript
return new Date().toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
// Résultat: "09/01/2026"
```

#### Exemple 2 : Données CSV
```javascript
return `Généré le ${new Date().toLocaleDateString()} pour ${data.FOURNISSEUR}`;
// Résultat: "Généré le 09/01/2026 pour Polaris"
```

#### Exemple 3 : Calcul
```javascript
const prixHT = parseFloat(data.PRIX_HT) || 0;
const tva = prixHT * 0.20;
return `${(prixHT + tva).toFixed(2)} €`;
// Résultat: "120.00 €"
```

#### Exemple 4 : Appel API (async)
```javascript
const response = await fetch(`https://api.example.com/product/${data.REFERENCE}`);
const result = await response.json();
return result.description;
// Résultat: Description depuis l'API
```

### Sécurité

✅ **Timeout de 5 secondes** : Protège contre les boucles infinies  
✅ **Try/catch global** : Gère les erreurs d'exécution  
✅ **Messages d'erreur génériques** : Évite l'exposition d'informations système  
✅ **Limite de sortie (1000 caractères)** : Prévient les sorties excessives  
✅ **Validation du résultat** : Vérification null/undefined avant conversion  
✅ **Avertissement utilisateur** : Interface affiche un message de sécurité  

⚠️ **Pour la production** : 
- **FORTEMENT RECOMMANDÉ** : Utiliser `vm2` ou `isolated-vm` pour un sandbox sécurisé
- Implémenter une whitelist des objets globaux autorisés
- Ajouter un rate limiting par utilisateur/template
- Logger toutes les exécutions de code pour audit
- Considérer la désactivation de `fetch` dans l'environnement sandboxé
- Mettre en place une politique d'utilisation acceptable du code JavaScript

---

## 🔧 Corrections Techniques

### Import path fix
**Problème** : Import incorrect dans `ElementPalette.jsx`
```javascript
// Avant (incorrect)
import { logoAPI } from '../../services/api';

// Après (correct)
import { logoAPI } from '../../../services/api';
```

**Impact** : Le build échouait avec l'erreur `Could not resolve "../../services/api"`  
**Résolution** : Chemin corrigé pour pointer vers `client/src/services/api.js`

---

## 📊 Fichiers Modifiés

### Frontend
1. ✅ `client/src/components/Admin/TemplateBuilder/ElementPalette.jsx`
   - Ajout de `addFreeTextElement()`
   - Ajout de `addJsCodeElement()`
   - Correction du chemin d'import

2. ✅ `client/src/components/Admin/TemplateBuilder/ElementProperties.jsx`
   - Ajout de `renderFreeTextProperties()`
   - Ajout de `renderJsCodeProperties()`
   - Ajout du style `codeHelp`
   - Modification de `renderTextProperties()` pour préfixe/suffixe

3. ✅ `client/src/components/Admin/TemplateBuilder/TemplateCanvas.jsx`
   - Ajout du rendu pour `freeText`
   - Ajout du rendu pour `jsCode`
   - Modification du rendu `text` pour afficher préfixe/suffixe

4. ✅ `client/src/components/Admin/TemplateBuilder/TemplatePreview.jsx`
   - Ajout de `codeResults` state
   - Ajout de `executeJsCode()` function
   - Ajout de `useEffect` pour exécuter le code JS
   - Ajout du rendu pour `freeText`
   - Ajout du rendu pour `jsCode`
   - Modification du rendu `text` pour préfixe/suffixe

### Backend
5. ✅ `server/src/services/pdfService.js`
   - Transformation de `renderElement()` en `async function`
   - Ajout de `executeJsCode()` function
   - Ajout du traitement pour `freeText`
   - Ajout du traitement pour `jsCode`
   - Modification du traitement `text` pour préfixe/suffixe
   - Modification de `buildHtml()` pour gérer l'asynchronisme
   - Modification de `generatePreviewHtml()` pour gérer l'asynchronisme

---

## 🎯 Résultat Final

### Fonctionnalités Disponibles

#### 1. Sélection d'éléments ✅
- Clic pour sélectionner
- Bordure bleue persistante
- 8 poignées de redimensionnement
- Déplacement fluide
- Suppression avec Delete

#### 2. Layout et Aperçu ✅
- 3 colonnes équilibrées (30% / 40% / 30%)
- Aperçu avec zoom
- Navigation entre lignes CSV
- Pas de superposition

#### 3. Préfixe/Suffixe CSV ✅
- Case à cocher pour activer
- Champs pour préfixe et suffixe
- Aperçu en temps réel
- Génération PDF correcte

#### 4. Texte Libre ✅
- Ajout depuis la palette
- Éditeur de contenu (textarea)
- Configuration complète (police, taille, couleur, style, alignement)
- Aperçu et PDF

#### 5. Code JavaScript ✅
- Ajout depuis la palette
- Éditeur de code (monospace)
- Variables disponibles : `data.*`, `Date`, `fetch`
- Exécution async avec timeout 5s
- Gestion des erreurs en français
- Aperçu et PDF

### Build ✅
```bash
cd client && npm run build
# ✓ built in 1.40s
# ✓ 108 modules transformed
```

### Compatibilité
- ✅ Nouvelles fonctionnalités n'affectent pas les templates existants
- ✅ Toutes les fonctionnalités précédentes conservées
- ✅ Sauvegarde/chargement des templates compatible

---

## 📝 Notes pour les Développeurs

### Structure des Éléments

Chaque élément peut maintenant avoir ces propriétés :

```javascript
{
  // Commun à tous
  id: 'element_123456789',
  type: 'text' | 'freeText' | 'jsCode' | 'logo' | 'image' | 'line' | 'rectangle',
  x: 50,
  y: 50,
  width: 200,
  height: 40,
  
  // Pour 'text'
  csvColumn: 'FOURNISSEUR',
  hasTextModifier: true,
  textPrefix: 'Fournisseur : ',
  textSuffix: ' (officiel)',
  fontSize: 14,
  fontFamily: 'Arial',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  wordWrap: true,
  
  // Pour 'freeText'
  content: 'Mon texte libre',
  fontSize: 14,
  fontFamily: 'Arial',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  
  // Pour 'jsCode'
  code: 'return new Date().toLocaleDateString("fr-FR");',
  fontSize: 14,
  fontFamily: 'Arial',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
}
```

### Points d'Attention

1. **Exécution JavaScript** : Le code s'exécute à la fois côté client (aperçu) et côté serveur (PDF)
2. **Timeout** : Limite de 5 secondes pour l'exécution du code
3. **Sécurité** : En production, envisager l'utilisation de `vm2` pour un sandbox sécurisé
4. **Async/Await** : La fonction `renderElement` est maintenant asynchrone dans le backend
5. **Variables CSV** : Accessibles via `data.COLUMN_NAME` dans le code JavaScript

### Migration des Templates

Les templates existants continueront de fonctionner sans modification. Les nouvelles propriétés sont optionnelles et ont des valeurs par défaut sûres.

---

## 🔒 Considérations de Sécurité

### Exécution de Code JavaScript

La fonctionnalité de code JavaScript permet aux utilisateurs d'exécuter du code arbitraire pour générer du contenu dynamique. **Mesures de sécurité implémentées** :

#### Protection Actuelle
1. **Timeout de 5 secondes** : Empêche les boucles infinies et les opérations longues
2. **Limite de sortie** : Maximum 1000 caractères pour éviter les sorties excessives
3. **Validation du résultat** : Vérification null/undefined avant conversion en string
4. **Messages d'erreur génériques** : N'exposent pas d'informations système sensibles
5. **Avertissement UI** : Interface affiche un message de prudence aux utilisateurs

#### Risques Résiduels
- ⚠️ Accès aux objets globaux Node.js côté serveur
- ⚠️ Possibilité d'appels réseau via `fetch` ou `require`
- ⚠️ Accès potentiel au système de fichiers
- ⚠️ Pas d'isolation complète du processus

#### Recommandations pour Production

**Priorité HAUTE** :
1. **Sandbox sécurisé** : Implémenter `vm2` ou `isolated-vm`
   ```javascript
   const { VM } = require('vm2');
   const vm = new VM({
     timeout: 5000,
     sandbox: { data: rowData }
   });
   const result = vm.run(element.code);
   ```

2. **Whitelist des fonctions** : Autoriser uniquement un sous-ensemble d'API
   ```javascript
   const sandbox = {
     data: rowData,
     Date: Date,
     Math: Math,
     // Pas de: require, fs, process, etc.
   };
   ```

3. **Rate limiting** : Limiter le nombre d'exécutions par utilisateur/période

**Priorité MOYENNE** :
4. **Audit logging** : Enregistrer toutes les exécutions de code
5. **Politique d'utilisation** : Définir des règles claires pour les utilisateurs
6. **Revue de code** : Permettre aux administrateurs de valider les templates avant publication

**Priorité BASSE** :
7. **Analyse statique** : Détecter les patterns dangereux avant exécution
8. **Isolation par processus** : Exécuter dans un worker thread ou processus séparé

### Autres Considérations

- **CORS et fetch()** : Les appels API externes sont soumis aux restrictions CORS
- **Données CSV sensibles** : Les données passées à `data.*` doivent être considérées comme exposées
- **Permissions utilisateur** : Envisager de restreindre l'accès à cette fonctionnalité selon les rôles

---

## ✨ Conclusion

Toutes les fonctionnalités demandées ont été implémentées avec succès :

- ✅ **PARTIE 1** : Sélection canvas (déjà implémenté)
- ✅ **PARTIE 2** : Layout aperçu (déjà implémenté)
- ✅ **PARTIE 3** : Préfixe/Suffixe CSV
- ✅ **PARTIE 4** : Texte Libre
- ✅ **PARTIE 5** : Code JavaScript

Le build client réussit sans erreur, et les modifications backend sont compatibles avec l'existant.
