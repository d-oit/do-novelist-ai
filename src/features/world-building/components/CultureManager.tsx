/**
 * Culture Manager Component
 * Specialized interface for managing cultures
 */

import { Plus, Users, Edit } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';

import { useWorldBuilding } from '../hooks/useWorldBuilding';
import type { Culture } from '../types';

import { WorldElementEditor } from './WorldElementEditor';

interface CultureManagerProps {
  projectId: string;
}

export const CultureManager: React.FC<CultureManagerProps> = ({ projectId }) => {
  const { cultures, createCulture, updateCulture, deleteCulture } = useWorldBuilding(projectId);
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = (): void => {
    setSelectedCulture(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (culture: Culture): void => {
    setSelectedCulture(culture);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleSave = (cultureData: Record<string, unknown>): void => {
    const culture = cultureData as Partial<Culture>;
    if (isCreating) {
      void createCulture(culture);
    } else if (selectedCulture) {
      void updateCulture(selectedCulture.id, culture);
    }
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string): void => {
    void deleteCulture(id);
    setIsEditorOpen(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Cultures ({cultures.length})</h2>
        <Button onClick={handleCreateNew}>
          <Plus className='mr-2 h-4 w-4' />
          Add Culture
        </Button>
      </div>

      {cultures.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {cultures.map(culture => (
            <Card key={culture.id} className='p-4 transition-shadow hover:shadow-lg'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-green-500' />
                  <h3 className='text-lg font-semibold'>{culture.name}</h3>
                </div>
                <Button variant='outline' size='sm' onClick={() => handleEdit(culture)}>
                  <Edit className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-2'>
                <span className='inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800'>
                  {culture.type.replace('-', ' ')}
                </span>

                <p className='line-clamp-3 text-sm text-muted-foreground'>{culture.description}</p>

                {(culture.values?.length ?? 0) > 0 && (
                  <div>
                    <p className='mb-1 text-xs font-medium text-muted-foreground'>Core Values:</p>
                    <div className='flex flex-wrap gap-1'>
                      {culture.values.slice(0, 4).map(value => (
                        <span
                          key={value}
                          className='rounded bg-green-50 px-2 py-1 text-xs text-green-700'
                        >
                          {value}
                        </span>
                      ))}
                      {culture.values.length > 4 && (
                        <span className='text-xs text-muted-foreground'>
                          +{culture.values.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {(culture.language?.length ?? 0) > 0 && (
                  <p className='text-xs text-muted-foreground'>Language: {culture.language}</p>
                )}

                {(culture.tags?.length ?? 0) > 0 && (
                  <div className='mt-2 flex flex-wrap gap-1'>
                    {culture.tags.slice(0, 3).map(tag => (
                      <span key={tag} className='rounded bg-muted px-2 py-1 text-xs'>
                        {tag}
                      </span>
                    ))}
                    {culture.tags.length > 3 && (
                      <span className='text-xs text-muted-foreground'>
                        +{culture.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className='py-12 text-center'>
          <Users className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
          <h3 className='mb-2 text-lg font-semibold'>No Cultures Yet</h3>
          <p className='mb-4 text-muted-foreground'>
            Add cultural depth to your world by creating your first culture
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className='mr-2 h-4 w-4' />
            Create First Culture
          </Button>
        </div>
      )}

      <WorldElementEditor
        element={selectedCulture}
        type='culture'
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};
