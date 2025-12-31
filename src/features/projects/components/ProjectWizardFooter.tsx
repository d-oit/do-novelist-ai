import { Plus } from 'lucide-react';
import React from 'react';

interface ProjectWizardFooterProps {
  title: string;
  style: string;
  idea: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export const ProjectWizardFooter: React.FC<ProjectWizardFooterProps> = ({
  title,
  style,
  idea,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className='flex shrink-0 items-center justify-between border-t border-border bg-secondary/10 px-6 py-4'>
      <p className='hidden text-xs text-muted-foreground md:block'>
        <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]'>Ctrl</kbd>
        {' + '}
        <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]'>Enter</kbd>
        {' to submit'}
      </p>
      <div className='flex gap-3'>
        <button
          onClick={onCancel}
          className='px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          Cancel
        </button>
        <button
          disabled={!title || !style || !idea}
          onClick={onSubmit}
          className='flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
          data-testid='wizard-submit-btn'
        >
          <Plus className='h-4 w-4' />
          Initialize Project
        </button>
      </div>
    </div>
  );
};
