const fs = require('fs');
const csv = require('csv-parser');

// Parse CSV file
exports.parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const fields = new Set();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
        // Collect all unique field names
        Object.keys(data).forEach(key => fields.add(key));
      })
      .on('end', () => {
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
