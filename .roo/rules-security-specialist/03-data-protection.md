# Data Protection Rules

## Purpose
Encryption and privacy rules for Novelist.ai user novel content.

## Rules
1. **Storage Encryption**
   - IndexedDB/Turso: encrypt novel content (CryptoJS AES)
   - Keys derived from user password (PBKDF2)

2. **Transmission**
   - Gemini API: HTTPS only
   - No content in query params

3. **Privacy**
   - No analytics on content
   - Local-first, opt-in sync

## Validation
- Crypto audits in tests
- No plaintext in localStorage

## Exceptions
- Metadata: unencrypted (title, genre)