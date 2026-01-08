const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Find project root (where package.json is)
const findProjectRoot = (startPath) => {
  let currentPath = startPath;
  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      const packageJson = require(path.join(currentPath, 'package.json'));
      if (packageJson.name === 'web-catalog') {
        return currentPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
};

const projectRoot = findProjectRoot(__dirname);
const dbPath = process.env.DB_PATH || path.join(projectRoot, 'database/catalog.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and export database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};
