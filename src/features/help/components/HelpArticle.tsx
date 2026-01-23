import { ArrowLeft } from 'lucide-react';
import React from 'react';

import type { HelpArticle as HelpArticleType } from '@/features/help/helpContent';
import { getRelatedArticles } from '@/features/help/helpContent';
import { Button } from '@/shared/components/ui/Button';

export interface HelpArticleProps {
  article: HelpArticleType;
  onBack: () => void;
  onRelatedArticle: (article: HelpArticleType) => void;
}

/**
 * Individual Help Article Component
 * Renders formatted help article content with navigation
 */
export const HelpArticle: React.FC<HelpArticleProps> = ({ article, onBack, onRelatedArticle }) => {
  // Render markdown-like content
  const renderContent = (content: string): React.ReactNode => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let inCodeBlock = false;

    for (const line of lines) {
      // Code block
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        elements.push(
          <pre key={elements.length} className='my-4 rounded-lg bg-muted p-4 font-mono text-sm'>
            {line}
          </pre>,
        );
        continue;
      }

      // Header
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={elements.length} className='mb-3 mt-6 text-xl font-semibold text-foreground'>
            {line.slice(3)}
          </h2>,
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={elements.length} className='mb-2 mt-4 text-lg font-medium text-foreground'>
            {line.slice(4)}
          </h3>,
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={elements.length} className='mb-4 text-2xl font-bold text-foreground'>
            {line.slice(2)}
          </h1>,
        );
      }
      // List item
      else if (line.trim().startsWith('- ')) {
        if (!inList) {
          inList = true;
          elements.push(<ul key={elements.length} className='my-3 ml-6 list-disc space-y-1' />);
        }
        elements.push(
          <li key={elements.length} className='text-foreground'>
            {line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </li>,
        );
      }
      // Empty line
      else if (line.trim() === '') {
        inList = false;
        elements.push(<br key={elements.length} />);
      }
      // Regular paragraph
      else {
        inList = false;
        const processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
          .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>',
          );

        elements.push(
          <p
            key={elements.length}
            className='mb-3 leading-relaxed text-foreground'
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />,
        );
      }
    }

    return elements;
  };

  const relatedArticles = getRelatedArticles(article.id);

  return (
    <div className='flex h-full flex-col'>
      {/* Article Header */}
      <div className='border-b px-8 py-6'>
        <Button variant='ghost' size='sm' onClick={onBack} className='mb-4 gap-1'>
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>
        <h1 className='text-2xl font-bold text-foreground'>{article.title}</h1>
        <div className='mt-2 flex flex-wrap gap-2'>
          {article.tags.map(tag => (
            <span key={tag} className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Article Content */}
      <div className='flex-1 overflow-y-auto px-8 py-6'>
        <article className='prose prose-sm max-w-none'>{renderContent(article.content)}</article>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className='border-t px-8 py-6'>
          <h3 className='mb-4 text-sm font-semibold text-foreground'>Related Articles</h3>
          <div className='space-y-2'>
            {relatedArticles.map(related => (
              <button
                key={related.id}
                onClick={() => onRelatedArticle(related)}
                className='w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary'
                type='button'
              >
                {related.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
