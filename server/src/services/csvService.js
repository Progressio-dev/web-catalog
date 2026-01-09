const fs = require('fs');
const csv = require('csv-parser');

// Get separator character from string
function getSeparator(separator) {
  const separators = {
    'comma': ',',
    'semicolon': ';',
    'tab': '\t',
    'pipe': '|',
  };
  
  // If it's a named separator, return the character
  if (separators[separator]) {
    return separators[separator];
  }
  
  // Otherwise, use it directly (handles custom separators)
  return separator || ',';
}

// Parse CSV file
exports.parseCSV = (filePath, separator = ',') => {
  return new Promise((resolve, reject) => {
    const results = [];
    const fields = new Set();

    const sep = getSeparator(separator);

    fs.createReadStream(filePath)
      .pipe(csv({ separator: sep }))
      .on('data', (data) => {
        // Clean BOM and whitespace from keys
        const cleanedData = {};
        Object.keys(data).forEach(key => {
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          cleanedData[cleanKey] = data[key];
          fields.add(cleanKey);
        });
        
        results.push(cleanedData);
      })
      .on('end', () => {
        // Log first row headers for debugging
        if (results.length > 0) {
          console.log('CSV Headers:', Object.keys(results[0]));
        }
        
        resolve({
          data: results,
          fields: Array.from(fields)
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Validate CSV data
exports.validateCSV = (data, requiredFields = []) => {
  if (!data || data.length === 0) {
    return { valid: false, error: 'CSV file is empty' };
  }

  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
};

// Detect separator from CSV content
exports.detectSeparator = (content) => {
  const separators = [',', ';', '\t', '|'];
  const counts = {};
  
  // Count occurrences of each separator in the first line
  const firstLine = content.split('\n')[0];
  
  separators.forEach(sep => {
    counts[sep] = (firstLine.match(new RegExp('\\' + sep, 'g')) || []).length;
  });
  
  // Return the separator with the highest count
  let maxCount = 0;
  let detectedSep = ',';
  
  for (const [sep, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedSep = sep;
    }
  }
  
  return detectedSep;
};
