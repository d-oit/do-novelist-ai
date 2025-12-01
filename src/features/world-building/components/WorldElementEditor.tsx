/**
 * World Element Editor
 * Generic editor for world-building elements
 */

import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Location, Culture } from '../types';
import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';

interface WorldElementEditorProps {
  element: Location | Culture | null;
  type: 'location' | 'culture';
  isOpen: boolean;
  onClose: () => void;
  onSave: (element: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export const WorldElementEditor: React.FC<WorldElementEditorProps> = ({
  element,
  type,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState(element ?? {});

  if (!isOpen) return null;

  const handleSave = (): void => {
    onSave(formData);
    onClose();
  };

  const handleDelete = (): void => {
    if (element && (element.id?.length ?? 0) > 0 && onDelete) {
      onDelete(element.id);
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <Card className='m-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto'>
        <div className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>{element ? `Edit ${type}` : `Create ${type}`}</h2>
            <Button variant='outline' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='mb-2 block text-sm font-medium'>Name</label>
              <input
                type='text'
                value={(formData as Location | Culture).name ?? ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder={`${type} name`}
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Type</label>
              <select
                value={(formData as Location | Culture).type ?? ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
              >
                {type === 'location' ? (
                  <>
                    <option value='city'>City</option>
                    <option value='town'>Town</option>
                    <option value='village'>Village</option>
                    <option value='country'>Country</option>
                    <option value='region'>Region</option>
                    <option value='continent'>Continent</option>
                    <option value='building'>Building</option>
                    <option value='landmark'>Landmark</option>
                    <option value='natural-feature'>Natural Feature</option>
                  </>
                ) : (
                  <>
                    <option value='civilization'>Civilization</option>
                    <option value='tribe'>Tribe</option>
                    <option value='nomadic'>Nomadic</option>
                    <option value='city-state'>City State</option>
                    <option value='empire'>Empire</option>
                    <option value='federation'>Federation</option>
                    <option value='clan'>Clan</option>
                    <option value='guild'>Guild</option>
                    <option value='religious-order'>Religious Order</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Description</label>
              <textarea
                value={(formData as Location | Culture).description ?? ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className='w-full resize-none rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder={`Describe this ${type}...`}
              />
            </div>

            {type === 'location' && (
              <>
                <div>
                  <label className='mb-2 block text-sm font-medium'>Population</label>
                  <input
                    type='number'
                    value={(formData as Location).population ?? ''}
                    onChange={e =>
                      setFormData({ ...formData, population: parseInt(e.target.value) ?? 0 })
                    }
                    className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='Population size'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium'>Geography</label>
                  <textarea
                    value={(formData as Location).geography ?? ''}
                    onChange={e => setFormData({ ...formData, geography: e.target.value })}
                    rows={3}
                    className='w-full resize-none rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='Geographic features and terrain...'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium'>Climate</label>
                  <input
                    type='text'
                    value={(formData as Location).climate ?? ''}
                    onChange={e => setFormData({ ...formData, climate: e.target.value })}
                    className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='Climate and weather patterns'
                  />
                </div>
              </>
            )}

            {type === 'culture' && (
              <>
                <div>
                  <label className='mb-2 block text-sm font-medium'>Core Values</label>
                  <input
                    type='text'
                    value={(formData as Culture).values?.join(', ') ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        values: e.target.value.split(',').map(v => v.trim()),
                      })
                    }
                    className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='honor, tradition, family (comma-separated)'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium'>Beliefs</label>
                  <textarea
                    value={(formData as Culture).beliefs ?? ''}
                    onChange={e => setFormData({ ...formData, beliefs: e.target.value })}
                    rows={3}
                    className='w-full resize-none rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='Religious and philosophical beliefs...'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium'>Social Structure</label>
                  <textarea
                    value={(formData as Culture).socialStructure ?? ''}
                    onChange={e => setFormData({ ...formData, socialStructure: e.target.value })}
                    rows={3}
                    className='w-full resize-none rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                    placeholder='How society is organized...'
                  />
                </div>
              </>
            )}

            <div>
              <label className='mb-2 block text-sm font-medium'>Tags</label>
              <input
                type='text'
                value={(formData as Location | Culture).tags?.join(', ') ?? ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(',')
                      .map(t => t.trim())
                      .filter(t => t.length > 0),
                  })
                }
                className='w-full rounded-md border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='fantasy, medieval, important (comma-separated)'
              />
            </div>
          </div>

          <div className='mt-6 flex items-center justify-between border-t border-border pt-6'>
            <div>
              {element && onDelete && (
                <Button
                  variant='outline'
                  onClick={handleDelete}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              )}
            </div>

            <div className='flex gap-3'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className='mr-2 h-4 w-4' />
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
