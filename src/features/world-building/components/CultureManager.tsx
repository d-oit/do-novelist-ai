/**
 * Culture Manager Component
 * Specialized interface for managing cultures
 */

import React, { useState } from 'react';
import { Plus, Users, Edit } from 'lucide-react';
import { useWorldBuilding } from '../hooks/useWorldBuilding';
import { WorldElementEditor } from './WorldElementEditor';
import type { Culture } from '../types';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';

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

  const handleSave = (cultureData: Partial<Culture>): void => {
    if (isCreating) {
      void createCulture(cultureData);
    } else if (selectedCulture) {
      void updateCulture(selectedCulture.id, cultureData);
    }
    setIsEditorOpen(false);
  };

  const handleDelete = (id: string): void => {
    void deleteCulture(id);
    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cultures ({cultures.length})</h2>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Culture
        </Button>
      </div>

      {cultures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cultures.map((culture) => (
            <Card key={culture.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-lg">{culture.name}</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(culture)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {culture.type.replace('-', ' ')}
                </span>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {culture.description}
                </p>

                {(culture.values?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Core Values:</p>
                    <div className="flex flex-wrap gap-1">
                      {culture.values.slice(0, 4).map((value) => (
                        <span key={value} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                          {value}
                        </span>
                      ))}
                      {culture.values.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{culture.values.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {(culture.language?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Language: {culture.language}
                  </p>
                )}

                {(culture.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {culture.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {culture.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
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
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cultures Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add cultural depth to your world by creating your first culture
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Culture
          </Button>
        </div>
      )}

      <WorldElementEditor
        element={selectedCulture}
        type="culture"
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
};