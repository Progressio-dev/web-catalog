const { dbRun, dbGet } = require('../config/database');

/**
 * Migration 001: Add new columns to templates table for enhanced configuration
 * - page_format: A4, A5, Letter, Custom
 * - page_orientation: portrait, landscape
 * - page_width: width in mm for custom format
 * - page_height: height in mm for custom format
 * - csv_separator: CSV separator character
 */

async function up() {
  console.log('Running migration 001: Adding template columns...');

  // Check if columns already exist
  const tableInfo = await dbGet("PRAGMA table_info(templates)");
  
  try {
    // Add page_format column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN page_format TEXT DEFAULT 'A4'
    `);
    console.log('✅ Added page_format column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  page_format column already exists');
    } else {
      throw error;
    }
  }

  try {
    // Add page_orientation column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN page_orientation TEXT DEFAULT 'portrait'
    `);
    console.log('✅ Added page_orientation column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  page_orientation column already exists');
    } else {
      throw error;
    }
  }

  try {
    // Add page_width column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN page_width REAL
    `);
    console.log('✅ Added page_width column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  page_width column already exists');
    } else {
      throw error;
    }
  }

  try {
    // Add page_height column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN page_height REAL
    `);
    console.log('✅ Added page_height column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  page_height column already exists');
    } else {
      throw error;
    }
  }

  try {
    // Add csv_separator column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN csv_separator TEXT DEFAULT ','
    `);
    console.log('✅ Added csv_separator column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  csv_separator column already exists');
    } else {
      throw error;
    }
  }

  console.log('✅ Migration 001 completed successfully');
}

async function down() {
  console.log('Rolling back migration 001...');
  console.log('⚠️  SQLite does not support DROP COLUMN, manual intervention required');
  // SQLite doesn't support DROP COLUMN easily
  // Would require recreating the table
}

// Run migration if executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
