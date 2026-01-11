const path = require('path');

/**
 * Resolve the upload directory path
 * If UPLOAD_DIR is set in environment, resolve it relative to process.cwd()
 * Otherwise, default to server/uploads relative to the server/src directory
 */
function getUploadDir() {
  if (process.env.UPLOAD_DIR) {
    const resolved = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
    return resolved;
  }
  // Default: server/uploads directory relative to server/src
  return path.join(__dirname, '../../uploads');
}

/**
 * Resolve the generated files directory path
 * If GENERATED_DIR is set in environment, resolve it relative to process.cwd()
 * Otherwise, default to server/generated relative to the server/src directory
 */
function getGeneratedDir() {
  if (process.env.GENERATED_DIR) {
    const resolved = path.resolve(process.cwd(), process.env.GENERATED_DIR);
    return resolved;
  }
  // Default: server/generated directory relative to server/src
  return path.join(__dirname, '../../generated');
}

module.exports = {
  getUploadDir,
  getGeneratedDir
};
