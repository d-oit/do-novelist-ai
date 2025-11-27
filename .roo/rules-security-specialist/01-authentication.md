# Authentication Rules

## Purpose
Authentication patterns for Novelist.ai client-side app with API keys.

## Rules
1. **API Key Handling**
   - VITE_GEMINI_API_KEY env only
   - Never log/store in IndexedDB unencrypted

2. **User Sessions**
   - Anonymous by default
   - Optional Turso auth for sync

3. **Token Management**
   - Short-lived Gemini tokens
   - Refresh via service worker?

## Validation
- No API_KEY in git, logs
- .env.example committed

## Exceptions
- Dev mocks: clear on prod