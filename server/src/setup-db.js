require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { db, dbRun, dbGet } = require('./config/database');

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await dbRun(statement);
    }

    console.log('Database schema created successfully');

    // Check if admin user exists
    const adminExists = await dbGet('SELECT * FROM users WHERE email = ?', [
      process.env.ADMIN_EMAIL || 'admin@progressio.dev'
    ]);

    if (!adminExists) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin123!',
        10
      );

      await dbRun(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [process.env.ADMIN_EMAIL || 'admin@progressio.dev', hashedPassword]
      );

      console.log('Default admin user created');
      console.log('Email:', process.env.ADMIN_EMAIL || 'admin@progressio.dev');
      console.log('Password:', process.env.ADMIN_PASSWORD || 'Admin123!');
    } else {
      console.log('Admin user already exists');
    }

    // Insert default settings if not exist
    const defaultSettings = [
      { key: 'product_image_base_url', value: process.env.PRODUCT_IMAGE_BASE_URL || 'https://cdn.example.com/products/' }
    ];

    for (const setting of defaultSettings) {
      const exists = await dbGet('SELECT * FROM settings WHERE key = ?', [setting.key]);
      if (!exists) {
        await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
        console.log(`Setting '${setting.key}' created`);
      }
    }

    // Create default template
    const templateExists = await dbGet('SELECT * FROM templates LIMIT 1');
    if (!templateExists) {
      const defaultTemplate = {
        elements: [
          {
            id: 'logo',
            type: 'image',
            source: 'logo',
            x: 20,
            y: 20,
            width: '200px',
            height: 'auto'
          },
          {
            id: 'reference',
            type: 'text',
            field: 'reference',
            x: 20,
            y: 100,
            fontSize: 24,
            fontWeight: 'bold'
          },
          {
            id: 'description',
            type: 'text',
            field: 'description',
            x: 20,
            y: 140,
            fontSize: 14
          }
        ]
      };

      await dbRun(
        'INSERT INTO templates (name, config, is_active) VALUES (?, ?, ?)',
        ['Default Template', JSON.stringify(defaultTemplate), 1]
      );

      console.log('Default template created');
    }

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
