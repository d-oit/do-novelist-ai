# Authentication

User authentication flows, password security, and session management.

## Password Security

### Password Hashing and Salting

```typescript
import bcrypt from 'bcrypt';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    // Always hash passwords with bcrypt
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### Password Policy

```typescript
export const PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < PasswordPolicy.minLength) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### Password Reset Flow

```typescript
export class PasswordResetService {
  async requestReset(email: string): Promise<void> {
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token with expiry (1 hour)
    await this.resetTokens.set(email, token, {
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    // Send email with secure link
    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const storedToken = await this.resetTokens.get(token);

    if (!storedToken || Date.now() > storedToken.expiresAt) {
      throw new Error('Invalid or expired token');
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Hash new password
    const hashed = await this.authService.hashPassword(newPassword);

    // Update user password
    await this.userService.updatePassword(userId, hashed);
  }
}
```

## JWT Token Management

```typescript
import jwt from 'jsonwebtoken';

export class TokenService {
  private readonly secretKey: string;
  private readonly expiresIn: string = '7d';

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  generateToken(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.secretKey, {
      expiresIn: this.expiresIn,
    });
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as { userId: string };
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }
}
```

## Session Management

```typescript
export class SessionService {
  private sessions = new Map<string, Session>();

  createSession(userId: string): Session {
    const sessionId = generateSecureId();
    const session: Session {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 1000, // 7 days
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }

    return true;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  destroyAllForUser(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
```

## Authentication Best Practices

### DO

```typescript
// ✅ Always hash passwords
await authService.hashPassword(password);

// ✅ Use strong password requirements
validatePassword(password);

// ✅ Implement rate limiting on auth endpoints
if (!rateLimiter.checkLimit(`auth:${email}`, 5, 60 * 1000)) {
  return res.status(429).json({ error: 'Too many login attempts' });
}

// ✅ Use secure token storage
export class SecureTokenStorage {
  private async getToken(key: string): Promise<string | null> {
    const token = localStorage.getItem(key);
    return token;
  }

  private async setToken(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
}

// ✅ Set secure cookie flags
res.setHeader('Set-Cookie', 'HttpOnly; Secure; SameSite=Strict');
```

### DON'T

```typescript
// ✗ Store passwords in plain text
const user = await db.query('SELECT * FROM users');
// user.password // Plain text password!

// ✗ Use weak hashing algorithms
crypto.createHash('md5'); // Fast but weak

// ✗ Allow weak passwords
const password = 'password'; // Should validate!

// ✗ Skip input validation
const login = await authService.login(email, password);
// No validation at all!

// ✗ Hardcode secrets
const API_KEY = 'sk-1234567890abcdef';

// ✗ Log sensitive data
logger.info('User login', { email, password }); // Leaked!
```

## Session Security

### Session Timeout

```typescript
// Validate session on every request
export async function validateSession(req: Request): Promise<void> {
  const sessionId = req.cookies.sessionId;

  if (!(await sessionService.validateSession(sessionId))) {
    res.clearCookie('sessionId');
    res.status(401).json({ error: 'Session expired' });
  }
}
```

### Concurrent Session Handling

```typescript
// Limit sessions per user
const MAX_CONCURRENT_SESSIONS = 3;

async function createSession(userId: string): Promise<Session> {
  const activeCount = await sessionService.countActiveSessions(userId);

  if (activeCount >= MAX_CONCURRENT_SESSIONS) {
    throw new Error('Maximum concurrent sessions exceeded');
  }

  return sessionService.createSession(userId);
}
```

---

Implement secure authentication following password, token, and session best
practices.
