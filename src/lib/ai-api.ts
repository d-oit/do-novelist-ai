/**
 * AI API Client
 * Calls server-side API routes to interact with AI providers
 * Avoids CORS issues by routing through Vercel serverless functions
 */

import type { AIProvider } from './ai-config';

const API_BASE = '/api/ai';

export interface GenerateTextParams {
  provider: AIProvider;
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
}

export interface GenerateTextResponse {
  text: string;
  error?: string;
}

/**
 * Generate text using the AI API
 */
export async function generateTextViaAPI(params: GenerateTextParams): Promise<string> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API request failed: ${response.status}`);
  }

  const data: GenerateTextResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.text;
}

export interface BrainstormParams {
  context: string;
  field: 'title' | 'style' | 'idea';
  provider?: AIProvider;
}

/**
 * Brainstorm using the AI API
 */
export async function brainstormViaAPI(params: BrainstormParams): Promise<string> {
  const response = await fetch(`${API_BASE}/brainstorm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `API request failed: ${response.status}`);
  }

  const data: GenerateTextResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.text;
}
