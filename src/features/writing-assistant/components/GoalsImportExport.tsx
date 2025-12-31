import React, { useState } from 'react';

import { cn } from '@/lib/utils';

interface GoalsImportExportProps {
  onExport: () => string;
  onImport: (data: string) => void;
  onClose: () => void;
}

export const GoalsImportExport: React.FC<GoalsImportExportProps> = ({
  onExport,
  onImport,
  onClose,
}) => {
  const [importData, setImportData] = useState('');

  const handleImport = (): void => {
    if (!importData.trim()) return;
    onImport(importData);
    setImportData('');
    onClose();
  };

  return (
    <div className='border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50'>
      <div className='space-y-3'>
        <div>
          <label className='mb-1 block text-sm font-medium'>Export Goals</label>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(onExport());
            }}
            className='text-sm text-indigo-600 hover:underline dark:text-indigo-400'
          >
            Copy to clipboard
          </button>
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium'>Import Goals</label>
          <textarea
            value={importData}
            onChange={e => setImportData(e.target.value)}
            placeholder='Paste exported goals JSON...'
            className={cn(
              'w-full rounded border p-2 text-sm',
              'bg-white dark:bg-gray-800',
              'border-gray-200 dark:border-gray-700',
            )}
            rows={3}
          />
          <button
            onClick={handleImport}
            disabled={!importData.trim()}
            className={cn(
              'mt-2 rounded px-3 py-1 text-sm',
              'bg-indigo-500 text-white',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};
