/**
 * Location Manager Component
 * Specialized interface for managing locations
 */

import React, { useState } from 'react';
import { Plus, MapPin, Edit } from 'lucide-react';
import { useWorldBuilding } from '../hooks/useWorldBuilding';
import { WorldElementEditor } from './WorldElementEditor';
import type { Location } from '../types';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';

interface LocationManagerProps {
  projectId: string;
}

export const LocationManager: React.FC<LocationManagerProps> = ({ projectId }) => {
  const { locations, createLocation, updateLocation, deleteLocation } = useWorldBuilding(projectId);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = (): void => {
    setSelectedLocation(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (location: Location): void => {
    setSelectedLocation(location);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleSave = (locationData: Record<string, unknown>): void => {
    const location = locationData as Partial<Location>;
    if (isCreating) {
      void createLocation(location);
    } else if (selectedLocation) {
      void updateLocation(selectedLocation.id, location);
    }
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string): void => {
    void deleteLocation(id);
    setIsEditorOpen(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Locations ({locations.length})</h2>
        <Button onClick={handleCreateNew}>
          <Plus className='mr-2 h-4 w-4' />
          Add Location
        </Button>
      </div>

      {locations.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {locations.map(location => (
            <Card key={location.id} className='p-4 transition-shadow hover:shadow-lg'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5 text-blue-500' />
                  <h3 className='text-lg font-semibold'>{location.name}</h3>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={() => handleEdit(location)}>
                    <Edit className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <span className='inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                  {location.type.replace('-', ' ')}
                </span>

                <p className='line-clamp-3 text-sm text-muted-foreground'>{location.description}</p>

                {(location.population ?? 0) > 0 && (
                  <p className='text-xs text-muted-foreground'>
                    Population: {location.population?.toLocaleString()}
                  </p>
                )}

                {(location.climate?.length ?? 0) > 0 && (
                  <p className='text-xs text-muted-foreground'>Climate: {location.climate}</p>
                )}

                {(location.tags?.length ?? 0) > 0 && (
                  <div className='mt-2 flex flex-wrap gap-1'>
                    {location.tags.slice(0, 3).map(tag => (
                      <span key={tag} className='rounded bg-muted px-2 py-1 text-xs'>
                        {tag}
                      </span>
                    ))}
                    {location.tags.length > 3 && (
                      <span className='text-xs text-muted-foreground'>
                        +{location.tags.length - 3} more
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
          <MapPin className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
          <h3 className='mb-2 text-lg font-semibold'>No Locations Yet</h3>
          <p className='mb-4 text-muted-foreground'>
            Start building your world by creating your first location
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className='mr-2 h-4 w-4' />
            Create First Location
          </Button>
        </div>
      )}

      <WorldElementEditor
        element={selectedLocation}
        type='location'
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};
