import { Sparkles, X } from 'lucide-react';
import React from 'react';

import { iconButtonTarget } from '@/lib/utils';

interface ProjectWizardHeaderProps {
  onCancel: () => void;
}

export const ProjectWizardHeader: React.FC<ProjectWizardHeaderProps> = ({ onCancel }) => {
  return (
    <div className='flex shrink-0 items-center justify-between border-b border-border bg-secondary/30 p-6'>
      <div>
        <h2 className='flex items-center gap-2 text-xl font-bold'>
          <Sparkles className='h-5 w-5 text-primary' />
          New Book Project
        </h2>
        <p className='text-sm text-muted-foreground'>
          Initialize the GOAP engine with your creative vision.
        </p>
      </div>
      <button
        onClick={onCancel}
        className={iconButtonTarget(
          'rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        )}
        aria-label='Close project wizard'
        data-testid='wizard-cancel-btn'
      >
        <X className='h-5 w-5' />
      </button>
    </div>
  );
};
