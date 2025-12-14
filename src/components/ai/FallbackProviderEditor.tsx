import { ArrowDown, ArrowUp, CheckCircle, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { getAIConfig, type AIProvider } from '@/lib/ai-config';
import { cn } from '@/lib/utils';

interface FallbackProviderEditorProps {
  userId: string;
  value: AIProvider[];
  onChange: (providers: AIProvider[]) => void;
}

interface ProviderEntry {
  id: AIProvider;
  name: string;
  enabled: boolean;
}

const ALL_PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral'];

export const FallbackProviderEditor: React.FC<FallbackProviderEditorProps> = ({
  // userId prop reserved for future use
  value,
  onChange,
}) => {
  const config = getAIConfig();

  const allProviders: ProviderEntry[] = useMemo(() => {
    return ALL_PROVIDERS.map(p => ({
      id: p,
      name: p,
      enabled: Boolean(config.providers[p]?.enabled),
    }));
  }, [config]);

  const [selected, setSelected] = useState<AIProvider[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const toggleProvider = (provider: AIProvider): void => {
    const isSelected = selected.includes(provider);
    const next = isSelected ? selected.filter(p => p !== provider) : [...selected, provider];
    setSelected(next);
    onChange(next);
  };

  const move = (provider: AIProvider, dir: 'up' | 'down'): void => {
    const idx = selected.indexOf(provider);
    if (idx === -1) return;
    const newIndex = dir === 'up' ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= selected.length) return;
    const next = [...selected];
    const [item] = next.splice(idx, 1);
    if (!item) return;
    next.splice(newIndex, 0, item);
    setSelected(next);
    onChange(next);
  };

  return (
    <div className='space-y-3' data-testid='fallback-editor'>
      <p className='text-sm text-muted-foreground'>
        Choose which providers to try if the primary one fails. Drag-and-drop is not required — use
        the arrow buttons to change priority.
      </p>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2' data-testid='provider-list'>
        {allProviders.map(p => {
          const isSelected = selected.includes(p.id);
          const isEnabled = p.enabled;
          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between rounded border p-3',
                isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200',
              )}
              data-testid={`provider-row-${p.id}`}
            >
              <div className='flex items-center gap-3'>
                {isEnabled ? (
                  <CheckCircle className='h-4 w-4 text-green-500' aria-label='enabled' />
                ) : (
                  <XCircle className='h-4 w-4 text-gray-400' aria-label='disabled' />
                )}
                <label htmlFor={`cb-${p.id}`} className='flex cursor-pointer items-center gap-2'>
                  <input
                    id={`cb-${p.id}`}
                    type='checkbox'
                    checked={isSelected}
                    onChange={() => toggleProvider(p.id)}
                    disabled={!isEnabled}
                    className='h-4 w-4'
                    aria-checked={isSelected}
                    aria-disabled={!isEnabled}
                    data-testid={`checkbox-${p.id}`}
                  />
                  <span className='capitalize'>{p.name}</span>
                  {!isEnabled && (
                    <span className='rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600'>
                      Not configured
                    </span>
                  )}
                </label>
              </div>

              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => move(p.id, 'up')}
                  disabled={!isSelected || selected.indexOf(p.id) === 0}
                  className='rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label={`move-${p.id}-up`}
                  data-testid={`move-up-${p.id}`}
                >
                  <ArrowUp className='h-4 w-4' />
                </button>
                <button
                  type='button'
                  onClick={() => move(p.id, 'down')}
                  disabled={!isSelected || selected.indexOf(p.id) === selected.length - 1}
                  className='rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'
                  aria-label={`move-${p.id}-down`}
                  data-testid={`move-down-${p.id}`}
                >
                  <ArrowDown className='h-4 w-4' />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className='rounded-lg border bg-white p-3' data-testid='selected-order'>
          <div className='text-sm font-medium'>Fallback order</div>
          <ol className='mt-2 list-decimal pl-5 text-sm'>
            {selected.map(p => (
              <li key={p} className='capitalize'>
                {p}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
