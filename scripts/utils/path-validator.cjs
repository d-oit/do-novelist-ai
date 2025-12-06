const path = require('path');

/**
 * Path validation utility for preventing shell command injection
 * Validates and sanitizes paths to prevent path traversal attacks
 */

/**
 * Validates a path for security issues
 * @param {string} inputPath - The path to validate
 * @returns {boolean} - True if path is valid and safe
 */
function validatePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    return false;
  }

  // Check for path traversal patterns
  const dangerousPatterns = [
    /\.\.[/\\]/,  // ../ or ..\
    /^[/\\]/,     // Absolute paths starting with / or \
    /^[a-zA-Z]:[/\\]/, // Windows absolute paths (C:\, D:\, etc.)
    /\0/,         // Null bytes
    /[<>:"|?*]/, // Invalid filename characters
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(inputPath)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a path for safe use in shell commands
 * @param {string} inputPath - The path to sanitize
 * @returns {string} - Sanitized path
 * @throws {Error} - If path is invalid or unsafe
 */
function sanitizePath(inputPath) {
  if (!validatePath(inputPath)) {
    throw new Error(`Invalid or unsafe path: ${inputPath}`);
  }

  // Normalize and resolve the path
  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);

  return resolved;
}

/**
 * Checks if a path is within the workspace boundaries
 * @param {string} inputPath - The path to check
 * @param {string} workspaceRoot - The workspace root directory (defaults to process.cwd())
 * @returns {boolean} - True if path is within workspace
 */
function isWithinWorkspace(inputPath, workspaceRoot = process.cwd()) {
  try {
    const sanitized = sanitizePath(inputPath);
    const relative = path.relative(workspaceRoot, sanitized);

    // If relative path starts with .. or is absolute, it's outside workspace
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  } catch {
    return false;
  }
}

module.exports = {
  validatePath,
  sanitizePath,
  isWithinWorkspace,
};
