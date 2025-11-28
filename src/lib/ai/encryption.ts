// Simple encryption for API keys
// In production, consider using Web Crypto API for more robust encryption

export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    // Simple base64 encoding (replace with real encryption for production)
    const encoded = btoa(apiKey);
    return encoded;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

export async function decryptApiKey(encryptedKey: string): Promise<string> {
  try {
    // Simple base64 decoding (replace with real decryption for production)
    const decoded = atob(encryptedKey);
    return decoded;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

export function validateApiKey(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.length < 10) return false;

  // Provider-specific validation
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 40;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 50;
    case 'google':
      return apiKey.length > 20;
    case 'meta':
      return apiKey.length > 20;
    case 'xai':
      return apiKey.length > 20;
    default:
      return true;
  }
}

export function getApiKeyInstructions(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'Get your API key from https://platform.openai.com/api-keys';
    case 'anthropic':
      return 'Get your API key from https://console.anthropic.com/';
    case 'google':
      return 'Get your API key from https://makersuite.google.com/app/apikey';
    case 'meta':
      return 'Get your API key from Meta developer portal';
    case 'xai':
      return 'Get your API key from https://x.ai/';
    default:
      return 'Contact support for API key setup instructions';
  }
}
