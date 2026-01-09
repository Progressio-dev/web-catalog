# Web Catalog

Application web complète pour générer des fiches articles à partir de fichiers CSV, avec interface d'administration WYSIWYG et génération PDF professionnelle.

## Fonctionnalités

### Interface Utilisateur
- Upload de fichiers CSV par drag & drop
- Sélection multiple de références
- Sélection de logos d'entreprise
- Configuration des champs à afficher
- Génération de PDF unitaire ou multi-pages
- Prévisualisation en temps réel

### Interface Administrateur
- Authentification sécurisée (JWT)
- Éditeur WYSIWYG drag & drop pour créer des templates
- Configuration des mappings CSV ↔ PDF
- Gestion des logos d'entreprise
- Configuration des URLs d'images produits
- Gestion de plusieurs templates

### Génération PDF
- Rendu haute qualité avec Puppeteer
- Support multi-pages
- Intégration automatique des images produits
- Format A4 professionnel

## Stack Technique

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **PDF Generation**: Puppeteer
- **Authentication**: JWT
- **Drag & Drop**: react-dnd

## Prérequis

- Node.js 18+ 
- npm ou yarn
- **Dépendances système pour Puppeteer** (voir ci-dessous)

## Installation

### 1. Installer les dépendances système (Linux/Ubuntu/Debian)

Puppeteer nécessite certaines bibliothèques système pour fonctionner correctement :

```bash
sudo apt-get update
sudo apt-get install -y \
  libgbm1 \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libxrandr2 \
  libpangocairo-1.0-0 \
  libcups2 \
  libdrm2
```

**Sur macOS et Windows**, ces dépendances sont généralement incluses avec Puppeteer.

### 2. Cloner le repository

```bash
git clone <repository-url>
cd web-catalog
```

### 3. Installer les dépendances Node.js

```bash
npm install
```

Cette commande va :
- Installer toutes les dépendances (root, client, serveur)
- Créer automatiquement les dossiers nécessaires (`server/uploads`, `server/generated`, `database`)
- Vérifier les dépendances système Puppeteer
- Copier `.env.example` vers `.env` si nécessaire
- Initialiser la base de données SQLite

### 4. Configuration (optionnel)

Le fichier `.env` est créé automatiquement. Modifiez-le si nécessaire :

```bash
nano .env
```

Variables disponibles :
- `PORT` : Port du serveur (défaut: 5000)
- `JWT_SECRET` : Secret pour JWT (changez-le en production!)
- `ADMIN_EMAIL` : Email admin par défaut
- `ADMIN_PASSWORD` : Mot de passe admin par défaut
- `PRODUCT_IMAGE_BASE_URL` : URL de base pour les images produits

## Démarrage

### Mode Développement

Pour démarrer le serveur backend et le client frontend simultanément :

```bash
npm run dev
```

Ou séparément :

```bash
# Backend seulement (port 5000)
npm run dev:server

# Frontend seulement (port 5173)
npm run dev:client
```

### Mode Production

```bash
# Build du frontend
npm run build

# Démarrage du serveur
npm start
```

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Interface**: http://localhost:5173/admin

## Credentials par défaut

Lors de la première connexion à l'interface admin :

- **Email**: `admin@progressio.dev`
- **Password**: `Admin123!`

⚠️ **Important**: Changez ces identifiants après la première connexion en production.

## Structure du Projet

```
web-catalog/
├── client/                 # Application React
│   ├── public/            # Assets statiques
│   ├── src/
│   │   ├── components/    # Composants React
│   │   │   ├── User/     # Interface utilisateur
│   │   │   └── Admin/    # Interface admin
│   │   ├── pages/        # Pages principales
│   │   ├── services/     # Services API
│   │   └── utils/        # Utilitaires
│   └── package.json
│
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── controllers/  # Contrôleurs API
│   │   ├── middleware/   # Middlewares
│   │   ├── models/       # Schéma DB
│   │   ├── routes/       # Routes API
│   │   └── services/     # Services métier
│   ├── uploads/          # Fichiers uploadés
│   ├── generated/        # PDFs générés
│   └── package.json
│
├── database/             # Base de données SQLite
└── package.json         # Configuration root
```

## API Endpoints

### Public

- `POST /api/upload-csv` - Upload et parse un fichier CSV
- `POST /api/generate-pdf` - Génère un PDF
- `GET /api/logos` - Liste des logos actifs

### Admin (Protected)

- `POST /api/auth/login` - Authentification
- `GET /api/auth/verify` - Vérification token
- `GET /api/templates` - Liste des templates
- `POST /api/templates` - Créer un template
- `PUT /api/templates/:id` - Modifier un template
- `DELETE /api/templates/:id` - Supprimer un template
- `POST /api/logos` - Upload un logo
- `DELETE /api/logos/:id` - Supprimer un logo
- `GET /api/mappings` - Récupérer les mappings
- `PUT /api/mappings` - Sauvegarder les mappings
- `GET /api/settings` - Paramètres
- `PUT /api/settings` - Modifier paramètres

## Utilisation

### 1. Upload CSV

Glissez-déposez votre fichier CSV sur la zone d'upload. Le fichier sera automatiquement parsé et validé.

### 2. Sélection des références

Cochez les références que vous souhaitez inclure dans le PDF.

### 3. Configuration

- Sélectionnez un logo d'entreprise
- Activez/désactivez les champs à afficher

### 4. Génération

- Cliquez sur "Générer PDF" pour un PDF avec toutes les références sélectionnées
- Le téléchargement démarre automatiquement

## Administration

### Créer un Template

1. Connectez-vous à `/admin`
2. Accédez à l'éditeur de templates
3. Glissez-déposez des éléments sur le canvas
4. Configurez les propriétés (position, style, etc.)
5. Sauvegardez le template

### Mapper les Champs CSV

1. Dans l'interface de mapping
2. Associez chaque champ CSV à une zone du template
3. Sauvegardez la configuration

### Gérer les Logos

1. Uploadez vos logos (PNG, JPG, SVG)
2. Activez/désactivez selon vos besoins
3. Les logos actifs apparaissent dans le sélecteur utilisateur

## Sécurité

- Authentification JWT avec expiration
- Passwords hashés avec bcrypt
- Validation des inputs
- Protection CSRF
- Rate limiting (recommandé en production)
- HTTPS recommandé en production

## Performance

- Cache des templates
- Compression des images
- Lazy loading des composants
- Cleanup automatique des PDFs anciens

## Développement

### Ajouter une dépendance

```bash
# Client
npm install <package> --workspace=client

# Server
npm install <package> --workspace=server
```

### Nettoyage

```bash
npm run clean
```

## Support

Pour toute question ou problème, ouvrez une issue sur le repository.

## Troubleshooting Puppeteer

### Erreur: "Failed to launch the browser process"

Cette erreur signifie généralement qu'il manque des dépendances système. Solutions :

1. **Vérifier les dépendances manquantes** :
```bash
ldd $(which chrome) # ou ldd ./node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome
```

2. **Réinstaller les dépendances système** :
```bash
sudo apt-get update
sudo apt-get install -y libgbm1 libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0
```

3. **Environnement sans tête (serveur sans GUI)** :
Puppeteer fonctionne en mode headless par défaut, mais vous pouvez forcer certaines options :
```javascript
// Dans server/src/services/pdfService.js, les args sont déjà configurés
args: ['--no-sandbox', '--disable-setuid-sandbox']
```

### Erreur: "Running as root without --no-sandbox is not supported"

Si vous exécutez l'application en tant que root (déconseillé), Puppeteer nécessite l'option `--no-sandbox` qui est déjà incluse dans la configuration.

### Performance lente de génération PDF

1. **Installer les fonts** (améliore le rendu) :
```bash
sudo apt-get install -y fonts-liberation fonts-noto-color-emoji
```

2. **Limiter le nombre de pages** : Générez les PDFs par lots plutôt que tout en une fois.

### Chromium ne se télécharge pas pendant l'installation

1. **Réinstaller Puppeteer manuellement** :
```bash
cd server
npm rebuild puppeteer
```

2. **Vérifier la connectivité internet** et les proxies éventuels.

## License

MIT
