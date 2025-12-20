import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { FallbackProviderEditor } from '@/components/ai/FallbackProviderEditor';

vi.mock('@/lib/ai-config', async () => {
  const actual = await vi.importActual<any>('@/lib/ai-config');
  return {
    ...actual,
    getAIConfig: () => ({
      defaultProvider: 'google',
      enableFallback: true,
      openrouterApiKey: 'test',
      defaultModel: 'gemini-2.0-flash-exp',
      thinkingModel: 'gemini-exp-1206',
      providers: {
        openai: {
          provider: 'openai',
          gatewayPath: 'openai',
          models: { fast: 'gpt-4o-mini', standard: 'gpt-4o', advanced: 'gpt-4o' },
          enabled: true,
        },
        anthropic: {
          provider: 'anthropic',
          gatewayPath: 'anthropic',
          models: {
            fast: 'claude-3-5-haiku-20241022',
            standard: 'claude-3-5-sonnet-20241022',
            advanced: 'claude-3-5-sonnet-20241022',
          },
          enabled: true,
        },
        google: {
          provider: 'google',
          gatewayPath: 'google',
          models: { fast: 'gemini-2.0-flash-exp', standard: 'gemini-2.0-flash-exp', advanced: 'gemini-exp-1206' },
          enabled: true,
        },
        mistral: {
          provider: 'mistral',
          gatewayPath: 'mistral',
          models: { fast: 'mistral-small-latest', standard: 'mistral-medium-latest', advanced: 'mistral-large-latest' },
          enabled: false,
        },
      },
    }),
  };
});

describe('FallbackProviderEditor', () => {
  let value: Array<'openai' | 'anthropic' | 'google' | 'mistral'>;
  let onChange: any;

  beforeEach(() => {
    value = ['openai'];
    onChange = vi.fn() as any;
  });

  it('renders providers with correct enabled state', () => {
    render(<FallbackProviderEditor userId='u1' value={value} onChange={onChange} />);
    expect(screen.getByTestId('provider-list')).toBeInTheDocument();
    // mistral disabled
    const mistralCb = screen.getByTestId('checkbox-mistral') as HTMLInputElement;
    expect(mistralCb.disabled).toBe(true);
  });

  it('toggles selection and calls onChange', () => {
    render(<FallbackProviderEditor userId='u1' value={value} onChange={onChange} />);
    const cb = screen.getByTestId('checkbox-anthropic') as HTMLInputElement;
    fireEvent.click(cb);
    expect(onChange).toHaveBeenCalledWith(['openai', 'anthropic']);
  });

  it('reorders selected providers using buttons', () => {
    value = ['openai', 'anthropic'];
    render(<FallbackProviderEditor userId='u1' value={value} onChange={onChange} />);

    // Move anthropic up
    const up = screen.getByTestId('move-up-anthropic');
    fireEvent.click(up);
    expect(onChange).toHaveBeenCalledWith(['anthropic', 'openai']);
  });
});
