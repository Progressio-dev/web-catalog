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

## Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd web-catalog
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande installera les dépendances pour le projet root, le client et le serveur.

### 3. Configuration

Copier le fichier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

Modifier les valeurs dans `.env` selon votre environnement.

### 4. Initialiser la base de données

```bash
npm run setup-db
```

Cette commande créera la base SQLite avec le schéma et l'utilisateur admin par défaut.

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

## License

MIT
