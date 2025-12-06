/**
 * Secure random number generation utilities
 * Uses cryptographically secure random sources for security-sensitive operations
 */

/**
 * Generates a cryptographically secure random ID
 * @param prefix - Optional prefix for the ID
 * @param length - Length of the random portion (default: 16)
 * @returns A secure random ID string
 */
export function generateSecureId(prefix = '', length = 16): string {
  const randomBytes = generateRandomBytes(length);
  const randomString = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return prefix ? `${prefix}-${randomString}` : randomString;
}

/**
 * Generates cryptographically secure random bytes
 * Works in both browser and Node.js environments
 * @param length - Number of random bytes to generate
 * @returns Uint8Array of random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }

  // Browser environment - use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buffer = new Uint8Array(length);
    window.crypto.getRandomValues(buffer);
    return buffer;
  }

  // Node.js environment - use crypto module
  // Note: In Node.js, crypto is a built-in module
  if (typeof global !== 'undefined' && typeof process !== 'undefined') {
    try {
      // Dynamic import for Node.js crypto module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeCrypto = require('node:crypto');
      return new Uint8Array(nodeCrypto.randomBytes(length));
    } catch {
      throw new Error('Crypto module not available in Node.js environment');
    }
  }

  throw new Error('No secure random source available');
}

/**
 * Generates a secure device ID
 * @returns A secure device ID with 'device' prefix
 */
export function generateDeviceId(): string {
  return generateSecureId('device', 16);
}

/**
 * Generates a secure user ID
 * @returns A secure user ID with 'user' prefix
 */
export function generateUserId(): string {
  return generateSecureId('user', 16);
}

/**
 * Generates a secure analysis record ID
 * @returns A secure analysis ID with 'analysis' prefix
 */
export function generateAnalysisId(): string {
  return generateSecureId('analysis', 16);
}

/**
 * Generates a secure feedback ID
 * @returns A secure feedback ID with 'feedback' prefix
 */
export function generateFeedbackId(): string {
  return generateSecureId('feedback', 16);
}

/**
 * Generates a secure preferences ID
 * @returns A secure preferences ID with 'prefs' prefix
 */
export function generatePreferencesId(): string {
  return generateSecureId('prefs', 16);
}
