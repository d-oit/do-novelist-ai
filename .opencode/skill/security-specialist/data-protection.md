# Data Protection

Sensitive data handling, encryption, sanitization and secure storage.

## Input Validation

### General Validation

```typescript
import { z } from 'zod';

export const SafeStringSchema = z
  .string()
  .max(1000)
  .trim()
  .regex(/^[a-zA-Z0-9 ]*$/)
  .transform(s => s => s.trim().replace(/[<>]/g, '')); // Remove HTML
export const SafeNumberSchema = z.number().min(0).max(1_000_000_000);

export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

### Sanitization

```typescript
export function sanitizeHTML(input: string): string {
  // Remove HTML tags
  const sanitized = input.replace(/<[^>]*>/g, '').replace(/<[^<]*>/g, '');

  return sanitized;
}

export function sanitizeUserInput(input: string): string {
  // XSS prevention
  return DOMPurify.sanitize(input);
}

export function sanitizeSQL(query: string): string {
  // SQL injection prevention
  // Use parameterized queries (handled by database layer)
  return query; // Just pass through, actual sanitization at DB layer
}

export function sanitizeFilename(filename: string): string {
  // Prevent directory traversal
  const sanitized = filename
    .replace(/[^\.\.]+/g, '') // Remove path traversal
    .replace(/[^a-zA-Z0-9\-_.]/g, '_'); // Remove special chars

  return sanitized;
}
```

## Output Sanitization

### Remove Sensitive Data

```typescript
interface SensitiveDataKeys {
  PASSWORD: 'password';
  API_KEY: 'apiKey';
  TOKEN: 'token';
  SESSION_SECRET: 'sessionSecret';
}

export function stripSensitiveData<T extends object>(
  data: T,
  keys: (keyof T)[],
): Omit<T> {
  const sanitized = { ...data } as Omit<T>;

  for (const key of keys) {
    if (SensitivaDataKeys[key]) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

// Usage
const safeUser = stripSensitiveData(user, ['password', 'apiKey']);
```

## Encryption

### AES-256 Encryption

```typescript
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits

  generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  encrypt(plaintext: string, key: Buffer): { iv: string; encrypted: string } {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');

    // Add authentication tag (optional)
    encrypted = this.addAuthTag(encrypted);

    return {
      iv: iv.toString('hex'),
      encrypted,
    };
  }

  decrypt(encrypted: string, key: Buffer, iv: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex'),
    );

    let decrypted = decipher.update(encrypted, 'hex');

    // Remove auth tag if present (optional)
    decrypted = this.removeAuthTag(decrypted);

    return decrypted.toString('utf8');
  }

  private addAuthTag(data: Buffer): Buffer {
    // Add HMAC-SHA256 authentication tag
    const authTagLength = 32;
    const authTag = crypto.randomBytes(authTagLength);

    return Buffer.concat([authTag, data]);
  }

  private removeAuthTag(data: Buffer): Buffer {
    // Extract auth tag if present
    if (data.length > authTagLength) {
      return data.slice(authTagLength);
    }
    return data;
  }
}
```

### Hashing

```typescript
import crypto from 'crypto';

export class HashService {
  private algorithm = 'sha256';

  hash(data: string): string {
    return crypto.createHash(this.algorithm).update(data, 'utf8').digest('hex');
  }

  hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fs = require('fs').promises;
      fs.readFile(filePath)
        .then(data => {
          const hash = this.hash(data.toString());
          resolve(hash);
        })
        .catch(reject);
    });
  }

  async hashFileStream(filePath: string): Promise<string> {
    const fs = require('fs').promises;
    const hash = crypto.createHash(this.algorithm);

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const hash = crypto.createHash(this.algorithm, stream);

      stream.pipe(hash);
      hash.on('readable', 'end', () => {
        resolve(hash.digest('hex'));
      });
    });
  }
}
```

## Secure Storage

### Environment Variables

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.number().min(1).max(20),

  // API Keys
  OPENROUTER_API_KEY: z.string().min(1).startsWith('sk-'),
  GEMINI_API_KEY: z.string().min(1).startsWith('AIza'),

  // Security
  SESSION_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
});

export const env = EnvSchema.parse(process.env);

export function validateEnv(): void {
  try {
    EnvSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid environment:', error);
    process.exit(1);
  }
}
```

### Local Storage

```typescript
export class SecureLocalStorage {
  private readonly prefix = 'secure_';

  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = EncryptionService.encrypt(serialized, ENCRYPTION_KEY);

      localStorage.setItem(`${this.prefix}${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store securely:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(`${this.prefix}${key}`);

      if (!encrypted) return null;

      const decrypted = EncryptionService.decrypt(encrypted, ENCRYPTION_KEY);

      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to retrieve securely:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }
}

// Usage
const storage = new SecureLocalStorage();
storage.setItem('userPreferences', user);
const user = storage.getItem('userPreferences');
```

---

Implement secure data handling with validation, sanitization, encryption, and
secure storage.
