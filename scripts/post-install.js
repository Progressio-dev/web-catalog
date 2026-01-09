#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPuppeteerDependencies() {
  log('\n📦 Vérification des dépendances système Puppeteer...', 'cyan');
  
  const requiredPackages = [
    'libgbm1',
    'libnss3',
    'libxss1',
    'libasound2',
    'libatk-bridge2.0-0',
    'libgtk-3-0'
  ];

  try {
    // Check if running on Linux
    if (process.platform !== 'linux') {
      log('⚠️  La vérification des dépendances système est uniquement disponible sur Linux', 'yellow');
      return true;
    }

    // Try to check if packages are installed (Debian/Ubuntu)
    let missingPackages = [];
    
    for (const pkg of requiredPackages) {
      try {
        execSync(`dpkg -l | grep -q "${pkg}"`, { stdio: 'ignore' });
      } catch (error) {
        missingPackages.push(pkg);
      }
    }

    if (missingPackages.length > 0) {
      log('⚠️  Dépendances système manquantes détectées!', 'yellow');
      log('\nPour installer les dépendances manquantes, exécutez:', 'yellow');
      log('\nSur Ubuntu/Debian:', 'bold');
      log(`sudo apt-get update && sudo apt-get install -y ${missingPackages.join(' ')}`, 'cyan');
      log('\nOu installez toutes les dépendances Puppeteer:', 'bold');
      log('sudo apt-get update && sudo apt-get install -y \\', 'cyan');
      log('  libgbm1 libnss3 libxss1 libasound2 \\', 'cyan');
      log('  libatk-bridge2.0-0 libgtk-3-0 \\', 'cyan');
      log('  libx11-xcb1 libxcomposite1 libxcursor1 \\', 'cyan');
      log('  libxdamage1 libxi6 libxtst6 libxrandr2 \\', 'cyan');
      log('  libpangocairo-1.0-0 libcups2 libdrm2', 'cyan');
      return false;
    } else {
      log('✅ Toutes les dépendances système sont installées', 'green');
      return true;
    }
  } catch (error) {
    log('⚠️  Impossible de vérifier les dépendances système', 'yellow');
    return true; // Continue anyway
  }
}

function createDirectories() {
  log('\n📁 Création des dossiers nécessaires...', 'cyan');
  
  const directories = [
    'server/uploads',
    'server/generated',
    'database'
  ];

  let created = 0;
  let existing = 0;

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`  ✅ Créé: ${dir}`, 'green');
      created++;
    } else {
      log(`  ℹ️  Existe déjà: ${dir}`, 'reset');
      existing++;
    }
  }

  log(`\n✅ ${created} dossier(s) créé(s), ${existing} existant(s)`, 'green');
}

function createGitkeepFiles() {
  log('\n📝 Création des fichiers .gitkeep...', 'cyan');
  
  const gitkeepDirs = [
    'server/uploads',
    'server/generated'
  ];

  for (const dir of gitkeepDirs) {
    const gitkeepPath = path.join(__dirname, '..', dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
      log(`  ✅ Créé: ${dir}/.gitkeep`, 'green');
    }
  }
}

function checkEnvFile() {
  log('\n⚙️  Vérification du fichier .env...', 'cyan');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('  ✅ Fichier .env créé à partir de .env.example', 'green');
      log('  ⚠️  N\'oubliez pas de configurer vos variables d\'environnement!', 'yellow');
    } else {
      log('  ⚠️  Fichier .env.example non trouvé', 'yellow');
    }
  } else {
    log('  ℹ️  Fichier .env existe déjà', 'reset');
  }
}

function initializeDatabase() {
  log('\n🗄️  Initialisation de la base de données...', 'cyan');
  
  const dbPath = path.join(__dirname, '..', 'database', 'catalog.db');
  
  if (fs.existsSync(dbPath)) {
    log('  ℹ️  Base de données existe déjà', 'reset');
    log('  💡 Pour réinitialiser la base de données, exécutez: npm run setup-db', 'yellow');
    return;
  }

  try {
    log('  📊 Exécution de setup-db...', 'cyan');
    execSync('npm run setup-db --workspace=server', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('  ✅ Base de données initialisée avec succès', 'green');
  } catch (error) {
    log('  ⚠️  Erreur lors de l\'initialisation de la base de données', 'red');
    log('  💡 Vous pouvez l\'initialiser manuellement avec: npm run setup-db', 'yellow');
  }
}

function displayWelcomeMessage() {
  log('\n' + '='.repeat(60), 'green');
  log('🎉 Installation terminée!', 'bold');
  log('='.repeat(60), 'green');
  
  log('\n📚 Prochaines étapes:', 'cyan');
  log('\n1. Configurez vos variables d\'environnement dans .env', 'reset');
  log('2. Démarrez l\'application en mode développement:', 'reset');
  log('   npm run dev', 'cyan');
  log('\n3. Accédez à l\'application:', 'reset');
  log('   - Frontend: http://localhost:5173', 'cyan');
  log('   - Admin: http://localhost:5173/admin', 'cyan');
  log('   - API: http://localhost:5000', 'cyan');
  
  log('\n🔑 Identifiants par défaut:', 'cyan');
  log('   Email: admin@progressio.dev', 'reset');
  log('   Password: Admin123!', 'reset');
  log('   ⚠️  Changez ces identifiants après la première connexion!', 'yellow');
  
  log('\n📖 Pour plus d\'informations, consultez le README.md', 'reset');
  log('');
}

// Main execution
async function main() {
  log('\n🚀 Post-installation de Web Catalog', 'bold');
  
  try {
    createDirectories();
    createGitkeepFiles();
    checkEnvFile();
    checkPuppeteerDependencies();
    initializeDatabase();
    displayWelcomeMessage();
  } catch (error) {
    log('\n❌ Erreur lors du post-install:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
