import { Plus, Target, RotateCcw, Download } from 'lucide-react';
import React from 'react';

interface GoalsPanelHeaderProps {
  activeCount: number;
  onTogglePresets: () => void;
  onToggleImportExport: () => void;
  onCreateNew: () => void;
}

export const GoalsPanelHeader: React.FC<GoalsPanelHeaderProps> = ({
  activeCount,
  onTogglePresets,
  onToggleImportExport,
  onCreateNew,
}) => {
  return (
    <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
      <div className='flex items-center gap-2'>
        <Target className='h-5 w-5 text-indigo-500' />
        <h3 className='font-semibold text-gray-900 dark:text-white'>Writing Goals</h3>
        <span className='text-xs text-gray-500 dark:text-gray-400'>{activeCount} active</span>
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={onTogglePresets}
          className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
          title='Apply preset'
        >
          <RotateCcw className='h-4 w-4' />
        </button>
        <button
          onClick={onToggleImportExport}
          className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
          title='Import/Export'
        >
          <Download className='h-4 w-4' />
        </button>
        <button
          onClick={onCreateNew}
          className='flex items-center gap-1 rounded bg-indigo-500 px-2 py-1 text-sm text-white transition-colors hover:bg-indigo-600'
        >
          <Plus className='h-4 w-4' />
          New Goal
        </button>
      </div>
    </div>
  );
};
