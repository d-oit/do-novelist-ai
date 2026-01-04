import { Search, Loader2, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { searchService } from '@/features/semantic-search';
import type { HydratedSearchResult } from '@/types/embeddings';

import { SearchResults } from './SearchResults';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onResultSelect?: (result: HydratedSearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onResultSelect,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HydratedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search execution
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      void (async (): Promise<void> => {
        try {
          const searchResults = await searchService.search(query, projectId);
          setResults(searchResults);
        } catch (err) {
          console.error('Search failed:', err);
          setError('Failed to perform search. Please try again.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, projectId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-4 backdrop-blur-sm sm:p-12 md:pt-32'>
      <div
        className='animate-in fade-in zoom-in-95 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200'
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className='relative flex items-center border-b border-border px-4 py-3'>
          <Search className='mr-3 h-5 w-5 text-muted-foreground' />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Ask AI or search your story...'
            className='flex-1 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none'
          />
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin text-muted-foreground' />}
          <button
            onClick={onClose}
            className='rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Results Area */}
        <div className='max-h-[60vh] overflow-y-auto p-2'>
          {error ? (
            <div className='p-4 text-center text-red-500'>{error}</div>
          ) : (
            <SearchResults
              results={results}
              isLoading={isLoading && results.length === 0} // Only show skeleton if no previous results
              onSelect={result => {
                onResultSelect?.(result);
                // Optional: keep open or close based on UX needs. closing for now.
                // onClose();
              }}
            />
          )}

          {!query && (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              <p>Search for characters, plot points, or world building details.</p>
              <p className='mt-2 text-xs opacity-70'>
                Examples: "Who is Elara?" or "Describe the ancient city"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t border-border bg-secondary/20 px-4 py-2 text-xs text-muted-foreground'>
          <span>Semantic Search Active</span>
          <div className='flex gap-2'>
            <kbd className='rounded border border-border bg-background px-1.5 py-0.5 font-mono shadow-sm'>
              ESC
            </kbd>{' '}
            to close
          </div>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className='fixed inset-0 -z-10' onClick={onClose} />
    </div>
  );
};
