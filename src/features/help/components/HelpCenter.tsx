import { X, Search } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

import type { HelpArticle as HelpArticleType } from '@/features/help/helpContent';
import { searchArticles } from '@/features/help/helpContent';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';

import { HelpArticle as HelpArticleComponent } from './HelpArticle';

export interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Help Center Modal Component
 * Main interface for browsing and searching help documentation
 */
export const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticleType | null>(null);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Handle search
  const handleSearch = useCallback((query: string): void => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setShowSearchResults(true);
      setSelectedArticle(null);
    } else {
      setShowSearchResults(false);
    }
  }, []);

  // Select an article to view
  const handleSelectArticle = useCallback((article: HelpArticleType): void => {
    setSelectedArticle(article);
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  // Go back to search results or categories
  const handleBack = useCallback((): void => {
    if (searchQuery.trim().length > 0) {
      setSelectedArticle(null);
      setShowSearchResults(true);
    } else {
      setSelectedArticle(null);
    }
  }, [searchQuery]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  });

  if (!isOpen) return null;

  const searchResults = searchQuery.trim().length > 0 ? searchArticles(searchQuery) : [];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden',
          'rounded-2xl border bg-card shadow-2xl',
          'transition-transform duration-200',
          isOpen ? 'scale-100' : 'scale-95',
        )}
        role='dialog'
        aria-modal='true'
        aria-label='Help Center'
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <h2 className='text-xl font-semibold'>Help Center</h2>
          <Button variant='ghost' size='icon' onClick={onClose} aria-label='Close help center'>
            <X className='h-5 w-5' />
          </Button>
        </div>

        {/* Search Bar */}
        <div className='border-b px-6 py-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input
              type='text'
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder='Search for help articles...'
              className='w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary'
              aria-label='Search help articles'
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Sidebar - Categories */}
          {!selectedArticle && (
            <aside className='w-64 overflow-y-auto border-r'>
              <div className='space-y-1 p-4'>
                {[
                  { id: 'getting-started', label: 'Getting Started' },
                  { id: 'projects-chapters', label: 'Projects & Chapters' },
                  { id: 'ai-features', label: 'AI Features' },
                  { id: 'plot-engine', label: 'Plot Engine' },
                  { id: 'world-building', label: 'World Building' },
                  { id: 'shortcuts', label: 'Keyboard Shortcuts' },
                  { id: 'troubleshooting', label: 'Troubleshooting' },
                  { id: 'publishing', label: 'Publishing Guide' },
                ].map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                      setSelectedArticle(null);
                    }}
                    className='w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary'
                    type='button'
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className='flex-1 overflow-y-auto'>
            {selectedArticle ? (
              <HelpArticleComponent
                article={selectedArticle}
                onBack={handleBack}
                onRelatedArticle={handleSelectArticle}
              />
            ) : showSearchResults ? (
              <div className='p-6'>
                <h3 className='mb-4 text-lg font-semibold'>
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.length === 0 ? (
                  <div className='py-12 text-center'>
                    <p className='text-muted-foreground'>No results found for "{searchQuery}"</p>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      Try different keywords or browse categories
                    </p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {searchResults.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        className='w-full rounded-lg border p-4 text-left transition-colors hover:border-border hover:bg-card/50'
                        type='button'
                      >
                        <h4 className='font-medium text-foreground'>{article.title}</h4>
                        <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                          {article.content.slice(0, 150)}...
                        </p>
                        <div className='mt-2 flex gap-2'>
                          {article.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className='p-6'>
                <div className='mb-8 rounded-lg bg-primary/5 p-6'>
                  <h3 className='text-lg font-semibold text-foreground'>How can we help you?</h3>
                  <p className='mt-2 text-sm text-muted-foreground'>
                    Search for articles or browse categories to find answers to your questions.
                  </p>
                </div>

                <h3 className='mb-4 text-lg font-semibold'>Popular Articles</h3>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {[
                    'first-project',
                    'chapters',
                    'ai-generate',
                    'plot-overview',
                    'locations',
                    'general-shortcuts',
                    'export-formats',
                    'common-issues',
                  ].map(articleId => {
                    const article = searchArticles(articleId)[0];
                    if (!article) return null;
                    return (
                      <button
                        key={articleId}
                        onClick={() => handleSelectArticle(article)}
                        className='rounded-lg border p-4 text-left transition-colors hover:border-border hover:bg-card/50'
                        type='button'
                      >
                        <h4 className='font-medium text-foreground'>{article.title}</h4>
                        <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                          {article.content.slice(0, 100)}...
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
