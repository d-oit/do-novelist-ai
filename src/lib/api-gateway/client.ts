/**
 * API Gateway Client
 * Client-side functions to call serverless API endpoints
 * No API keys exposed - all authentication happens server-side
 */

interface GenerateRequest {
  provider: string;
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
}

interface BrainstormRequest {
  context: string;
  field: 'title' | 'style' | 'idea';
  provider?: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

async function apiClient<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<APIResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API request failed',
        details: data.details,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function generateText(
  request: GenerateRequest,
): Promise<APIResponse<{ text: string }>> {
  return apiClient<{ text: string }>(
    '/api/ai/generate',
    request as unknown as Record<string, unknown>,
  );
}

export async function brainstorm(
  request: BrainstormRequest,
): Promise<APIResponse<{ text: string }>> {
  return apiClient<{ text: string }>(
    '/api/ai/brainstorm',
    request as unknown as Record<string, unknown>,
  );
}

export async function getCostInfo(): Promise<
  APIResponse<{
    totalCost: number;
    requestCount: number;
    budgetRemaining: number;
    shouldAlert: boolean;
  }>
> {
  try {
    const response = await fetch('/api/ai/cost-info');
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get cost info',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
