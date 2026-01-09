const { dbRun } = require('../config/database');

/**
 * Migration 002: Add background_color column to templates table
 * - background_color: Page background color in hex format (default: #FFFFFF)
 */

async function up() {
  console.log('Running migration 002: Adding background_color column...');

  try {
    // Add background_color column
    await dbRun(`
      ALTER TABLE templates ADD COLUMN background_color TEXT DEFAULT '#FFFFFF'
    `);
    console.log('✅ Added background_color column');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  background_color column already exists');
    } else {
      throw error;
    }
  }

  console.log('✅ Migration 002 completed successfully');
}

async function down() {
  console.log('Rolling back migration 002...');
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
