# Migration Guide - v1.x to v2.0

## Overview

Version 2.0 introduces major improvements to the template system, including:
- Multiple page formats (A4, A5, Letter, Custom)
- Custom CSV separators
- Enhanced drag & drop template builder
- Step-by-step user workflow

This guide will help you migrate from version 1.x to 2.0 safely.

## Prerequisites

- Node.js 18+
- Backup of your current database
- System dependencies for Puppeteer (see README.md)

## Migration Steps

### 1. Backup Your Data

Before starting the migration, backup your existing data:

```bash
# Backup database
cp database/catalog.db database/catalog.db.backup

# Backup logos
tar -czf logos_backup.tar.gz server/uploads/

# Backup environment file
cp .env .env.backup
```

### 2. Update Code

```bash
# Pull latest changes
git pull origin main

# Or if you're on a specific branch
git fetch origin
git checkout <branch-name>
git pull
```

### 3. Install Dependencies

The post-install script will automatically handle most of the setup:

```bash
npm install
```

This will:
- Install all dependencies
- Create missing directories
- Run database migrations
- Check system dependencies

### 4. Manual Migration (if needed)

If the automatic migration fails, you can run it manually:

```bash
npm run migrate --workspace=server
```

### 5. Verify Database Schema

Check that the new columns have been added:

```bash
# Using sqlite3 CLI
sqlite3 database/catalog.db "PRAGMA table_info(templates);"
```

You should see these new columns:
- `page_format`
- `page_orientation`
- `page_width`
- `page_height`
- `csv_separator`

### 6. Update Existing Templates

The migration adds default values to existing templates:
- `page_format`: 'A4'
- `page_orientation`: 'portrait'
- `csv_separator`: ','

You can update these through the admin interface if needed.

### 7. Test the Application

```bash
# Start in development mode
npm run dev

# Or build and start in production
npm run build
npm start
```

### 8. Verify Functionality

1. **Admin Interface**:
   - Log in to `/admin`
   - Check that all existing templates are listed
   - Try creating a new template
   - Test the new template builder

2. **User Interface**:
   - Access the home page
   - Test template selection
   - Upload a CSV file
   - Generate a PDF

## Common Issues

### Issue: Migration Script Fails

**Solution**:
```bash
# Check database connectivity
ls -la database/

# Ensure database file exists and is writable
chmod 664 database/catalog.db

# Run migration manually
npm run migrate --workspace=server
```

### Issue: Puppeteer Dependencies Missing

**Symptoms**: PDF generation fails with browser launch error

**Solution** (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y \
  libgbm1 libnss3 libxss1 libasound2 \
  libatk-bridge2.0-0 libgtk-3-0
```

See README.md Troubleshooting section for more details.

### Issue: Existing Templates Not Displaying

**Solution**:
1. Check the browser console for errors
2. Verify the template config JSON is valid
3. Templates with old structure may need to be recreated

### Issue: CSV Upload Fails

**Symptoms**: CSV upload returns an error

**Possible causes**:
- Incorrect separator
- File encoding issues
- Large file size

**Solution**:
1. Try different separators (comma, semicolon, tab)
2. Ensure CSV is UTF-8 encoded
3. Check file size limit in `.env` (MAX_FILE_SIZE)

### Issue: Logos Not Loading

**Solution**:
1. Verify logos exist in `server/uploads/`
2. Check file permissions
3. Verify logo paths in database:
   ```bash
   sqlite3 database/catalog.db "SELECT id, name, path FROM logos;"
   ```

## Rollback Procedure

If you need to rollback to version 1.x:

```bash
# 1. Stop the application
# (Ctrl+C if running in development)

# 2. Restore database
cp database/catalog.db.backup database/catalog.db

# 3. Restore logos
tar -xzf logos_backup.tar.gz

# 4. Restore environment
cp .env.backup .env

# 5. Checkout previous version
git checkout v1.x
# Or specific commit
git checkout <commit-hash>

# 6. Reinstall dependencies
npm run clean
npm install

# 7. Restart application
npm run dev
```

## New Features to Explore

After successful migration, try these new features:

### 1. Create a Template with Custom Format

1. Go to Admin → Templates → New Template
2. Upload a test CSV
3. Select "Custom" format and enter dimensions
4. Build your template with drag & drop
5. Save and test

### 2. Use Multiple Page Orientations

1. Create templates in both portrait and landscape
2. Compare PDF output
3. Use landscape for wide data tables

### 3. Try Different CSV Separators

1. Prepare CSV with semicolon separator
2. Select appropriate separator in template
3. Upload and generate PDF

### 4. Explore the New User Workflow

1. Access the home page (or `/new` for new workflow)
2. Follow the 4-step process
3. Notice the progress indicator

## Performance Considerations

### Database Size

The migration adds columns but doesn't significantly increase database size. However, if you have many templates:

```bash
# Check database size
du -h database/catalog.db

# Optimize (vacuum) if needed
sqlite3 database/catalog.db "VACUUM;"
```

### PDF Generation

The new system is optimized but:
- Large batch PDFs may take longer
- Consider generating in smaller batches
- Monitor memory usage with many images

### File Cleanup

Temporary files are automatically cleaned up, but you can manually clean:

```bash
# Clean old uploads
find server/uploads -name "csv-*" -mtime +7 -delete

# Clean old generated PDFs
find server/generated -name "*.pdf" -mtime +7 -delete
```

## Support

If you encounter issues not covered in this guide:

1. Check the CHANGELOG.md for known issues
2. Review the README.md troubleshooting section
3. Check browser console for errors
4. Review server logs
5. Open an issue on the repository

## Checklist

Use this checklist to track your migration:

- [ ] Backup database
- [ ] Backup logos
- [ ] Backup .env file
- [ ] Pull latest code
- [ ] Run `npm install`
- [ ] Verify migration completed
- [ ] Check database schema
- [ ] Test admin login
- [ ] Test template list
- [ ] Create new template
- [ ] Test user workflow
- [ ] Generate test PDF
- [ ] Verify existing templates work
- [ ] Update documentation if customized

---

**Need help?** Open an issue on the GitHub repository with:
- Version you're migrating from
- Error messages
- Steps to reproduce
- Your environment (OS, Node version, etc.)
