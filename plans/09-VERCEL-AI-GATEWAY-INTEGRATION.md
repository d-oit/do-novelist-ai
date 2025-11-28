# Vercel AI Gateway Integration Plan

**Date:** 2025-11-28  
**Project:** Novelist.ai - AI Provider Migration  
**Method:** GOAP Multi-Agent Orchestration  
**Priority:** High (P0)  

---

## Executive Summary

This plan outlines the migration from direct Gemini API calls to Vercel AI Gateway, enabling users to configure their preferred AI provider, model, and API keys. The migration will transform Novelist.ai from a single-provider application to a flexible, multi-provider AI writing platform.

**Key Benefits:**
- ✅ **Provider Flexibility**: Users can choose from OpenAI, Anthropic, Google, Meta, or xAI
- ✅ **Cost Optimization**: Users can select models based on their budget and needs
- ✅ **Reliability**: Automatic failover between providers prevents service interruptions
- ✅ **Zero Markup**: Users pay provider-direct pricing through their own API keys
- ✅ **Unified Interface**: Single codebase supports all providers through AI SDK 5

---

## Current State Analysis

### Existing Implementation
```typescript
// src/lib/gemini.ts - Direct Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
export async function generateText(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Limitations
- **Single Provider**: Locked into Google Gemini only
- **Hardcoded Configuration**: Environment variables, no user control
- **No Cost Transparency**: Users can't choose pricing tiers
- **Provider Risk**: Gemini downtime affects all users
- **Limited Model Selection**: No access to other specialized models

---

## Target Architecture

### Multi-Provider Gateway Integration
```typescript
// src/lib/ai-gateway.ts - Unified AI Interface
import { generateText, streamText } from 'ai';
import { createOpenAI, createAnthropic, createGoogleGenerativeAI } from 'ai';

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIGatewayClient {
  async generateText(prompt: string, config: AIProviderConfig): Promise<string>
  async *streamText(prompt: string, config: AIProviderConfig): AsyncGenerator<string>
}
```

### User Configuration Storage
```typescript
// Database Schema
interface UserAIConfig {
  id: string;
  userId: string;
  provider: string;
  model: string;
  encryptedApiKey: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Implementation Phases

### Phase 1: Foundation Setup (Priority P0)
**Estimated Time:** 4 hours  
**Owner:** GOAP Agent Orchestration

#### Tasks
1. **Install AI SDK Dependencies**
   ```bash
   npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
   ```

2. **Create AI Gateway Client**
   - `src/lib/ai-gateway.ts` - Unified provider interface
   - `src/lib/ai-config.ts` - Configuration types and constants
   - Provider factory pattern for dynamic model selection

3. **Database Schema Migration**
   - Add `user_ai_configs` table to IndexedDB
   - Add `ai_usage_logs` table for tracking
   - Encryption utilities for API key storage

4. **API Endpoints**
   - `POST /api/ai-config` - Save user configuration
   - `GET /api/ai-config/:userId` - Load user configuration
   - `PUT /api/ai-config/:id` - Update configuration

#### Quality Gates
- ✅ All providers can generate test responses
- ✅ API keys are encrypted before storage
- ✅ Configuration persists across browser sessions
- ✅ Error handling for invalid API keys

---

### Phase 2: User Interface Implementation (Priority P0)
**Estimated Time:** 6 hours  
**Owner:** Frontend Agent

#### Tasks
1. **AI Provider Settings Component**
   - `src/components/settings/AIProviderSettings.tsx`
   - Provider selection dropdown
   - Model selection based on provider
   - API key input with validation
   - Temperature and max tokens sliders

2. **Configuration Management Hook**
   - `src/lib/hooks/useAIConfig.ts`
   - Load/save configuration from database
   - localStorage fallback for offline
   - Real-time configuration updates

3. **Settings Integration**
   - Add AI Provider section to existing Settings feature
   - Configuration validation and error display
   - Test connection functionality

4. **Novel Generator Component Update**
   - Modify existing generation components to use new gateway
   - Add provider/model display in generation UI
   - Implement streaming with AbortController

#### Quality Gates
- ✅ Users can configure all supported providers
- ✅ Configuration persists across page reloads
- ✅ Invalid API keys show helpful error messages
- ✅ Streaming works for all providers

---

### Phase 3: Migration & Integration (Priority P1)
**Estimated Time:** 3 hours  
**Owner:** Integration Agent

#### Tasks
1. **Replace Direct Gemini Calls**
   - Update `src/lib/gemini.ts` to use AI Gateway
   - Maintain backward compatibility during transition
   - Add migration path for existing users

2. **Update Feature Integration**
   - Editor feature generation calls
   - Character generation in Characters feature
   - Analytics insights generation
   - Publishing assistance features

3. **Error Handling Enhancement**
   - Provider-specific error messages
   - Automatic retry with fallback providers
   - Rate limiting handling
   - Network error recovery

4. **Usage Tracking Implementation**
   - Token usage logging
   - Cost estimation by provider/model
   - Usage analytics in dashboard
   - Export usage reports

#### Quality Gates
- ✅ All existing features work with new gateway
- ✅ No breaking changes for current Gemini users
- ✅ Graceful fallback when providers fail
- ✅ Usage tracking accurate across all providers

---

### Phase 4: Advanced Features (Priority P2)
**Estimated Time:** 5 hours  
**Owner:** Feature Agent

#### Tasks
1. **Provider Switching**
   - Mid-session provider changes
   - Model comparison tools
   - A/B testing between providers
   - Quality scoring by provider

2. **Cost Optimization**
   - Automatic provider selection based on cost
   - Token usage optimization
   - Budget alerts and limits
   - Cost prediction before generation

3. **Advanced Configuration**
   - Custom model parameters
   - System prompts per provider
   - Response formatting options
   - Batch generation capabilities

4. **Analytics & Insights**
   - Provider performance metrics
   - User preference tracking
   - Generation quality analysis
   - Recommendation engine

#### Quality Gates
- ✅ Advanced features work without breaking basic functionality
- ✅ Analytics provide actionable insights
- ✅ Cost optimization reduces user expenses
- ✅ Provider switching is seamless

---

## Supported Providers & Models

### OpenAI
- **Models:** gpt-4o, gpt-4-turbo, gpt-3.5-turbo
- **Strengths:** Balanced performance, cost-effective
- **Use Cases:** General writing, editing, brainstorming

### Anthropic
- **Models:** claude-3-5-sonnet, claude-3-opus, claude-3-haiku
- **Strengths:** Creative writing, long context (200K tokens)
- **Use Cases:** Novel generation, character development

### Google
- **Models:** gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
- **Strengths:** Fast generation, cost-effective
- **Use Cases:** Quick drafts, real-time suggestions

### Meta
- **Models:** llama-3.1-405b, llama-3.1-70b
- **Strengths:** Open source, customizable
- **Use Cases:** Specialized writing, custom training

### xAI
- **Models:** grok-2, grok-2-vision-1212
- **Strengths:** Real-time data, humor
- **Use Cases:** Contemporary fiction, dialogue

---

## Database Schema Design

### User AI Configuration
```sql
CREATE TABLE user_ai_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'meta', 'xai')),
  model TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  temperature REAL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000 CHECK (max_tokens >= 100 AND max_tokens <= 4000),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### AI Usage Logs
```sql
CREATE TABLE ai_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_estimate REAL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN ('success', 'failed', 'rate_limited')),
  error_message TEXT,
  FOREIGN KEY (config_id) REFERENCES user_ai_configs(id)
);
```

---

## Security Considerations

### API Key Encryption
- Use Web Crypto API for client-side encryption
- Encrypt with user-specific key before storage
- Never log or expose raw API keys
- Implement key rotation functionality

### Data Privacy
- All prompts processed through user's own API keys
- No data shared with Vercel or other third parties
- Optional local-only processing mode
- GDPR and CCPA compliant data handling

### Access Control
- Users can only access their own configurations
- Implement proper authentication checks
- Rate limiting per user configuration
- Audit logging for configuration changes

---

## Testing Strategy

### Unit Tests
- AI Gateway client functionality
- Configuration encryption/decryption
- Provider factory pattern
- Error handling scenarios

### Integration Tests
- End-to-end provider testing
- Configuration persistence
- API key validation
- Streaming functionality

### E2E Tests
- User configuration workflow
- Provider switching scenarios
- Error recovery testing
- Usage tracking verification

### Performance Tests
- Gateway latency measurement
- Concurrent request handling
- Memory usage optimization
- Bundle size impact

---

## Migration Checklist

### Pre-Migration
- [ ] Backup existing configurations
- [ ] Test all provider integrations
- [ ] Verify encryption implementation
- [ ] Create rollback plan

### Migration
- [ ] Install AI SDK dependencies
- [ ] Create AI Gateway client
- [ ] Implement database schema
- [ ] Build configuration UI
- [ ] Update existing integrations
- [ ] Add usage tracking

### Post-Migration
- [ ] Verify all features work
- [ ] Test provider failover
- [ ] Validate cost tracking
- [ ] Update documentation
- [ ] Monitor performance metrics

---

## Risk Management

### High-Risk Items
1. **API Key Security**
   - **Risk:** Exposure of user API keys
   - **Mitigation:** Client-side encryption, secure storage

2. **Provider Downtime**
   - **Risk:** Service interruption
   - **Mitigation:** Automatic failover, multiple providers

3. **Cost Overruns**
   - **Risk:** Unexpected token usage
   - **Mitigation:** Usage tracking, cost alerts

### Medium-Risk Items
1. **Breaking Changes**
   - **Risk:** Existing features stop working
   - **Mitigation:** Backward compatibility, gradual migration

2. **Performance Degradation**
   - **Risk:** Slower response times
   - **Mitigation:** Gateway optimization, caching

---

## Success Metrics

### Technical Metrics
- ✅ Zero breaking changes for existing users
- ✅ <100ms additional latency vs direct API
- ✅ 99.9% uptime with automatic failover
- ✅ Support for all 5 major providers

### User Experience Metrics
- ✅ Users can configure providers in <2 minutes
- ✅ Configuration persists across sessions
- ✅ Clear error messages for invalid configurations
- ✅ Cost transparency before generation

### Business Metrics
- ✅ Increased user retention due to provider choice
- ✅ Reduced support requests for AI issues
- ✅ Better cost control for users
- ✅ Competitive advantage over single-provider tools

---

## Next Steps

1. **Immediate (This Week)**
   - Begin Phase 1 foundation setup
   - Test AI SDK integration
   - Create database schema

2. **Short-term (Next 2 Weeks)**
   - Complete Phase 2 UI implementation
   - Migrate existing Gemini users
   - Launch beta testing

3. **Long-term (Next Month)**
   - Implement Phase 3 full integration
   - Add Phase 4 advanced features
   - Monitor and optimize performance

---

## Documentation Updates Required

- [ ] Update `AGENTS.md` with new AI integration commands
- [ ] Modify `README.md` with multi-provider support
- [ ] Create AI configuration user guide
- [ ] Update API documentation
- [ ] Add troubleshooting guide for provider issues

---

**Document Status:** ✅ Ready for Implementation  
**Total Estimated Time:** 18 hours  
**Implementation Priority:** P0 (Critical)  
**Expected Completion:** 2025-12-05

---

This migration will transform Novelist.ai into a flexible, user-centric AI writing platform while maintaining the high-quality experience users expect.