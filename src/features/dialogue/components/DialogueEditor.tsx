/**
 * Dialogue Editor Component
 *
 * Focused editor view showing only dialogue lines from a chapter
 */

import { MessageSquare, User, Tag } from 'lucide-react';
import React, { useState } from 'react';

import type { DialogueLine, DialogueEditorSettings } from '@/features/dialogue/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

interface DialogueEditorProps {
  lines: DialogueLine[];
  settings: DialogueEditorSettings;
  onUpdateLine: (lineId: string, updates: Partial<DialogueLine>) => void;
  onSettingsChange: (settings: Partial<DialogueEditorSettings>) => void;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  lines,
  settings,
  onUpdateLine,
  onSettingsChange,
}) => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const handleLineClick = (lineId: string): void => {
    setSelectedLineId(lineId === selectedLineId ? null : lineId);
  };

  const handleEditLine = (lineId: string): void => {
    setEditingLineId(lineId);
  };

  const handleSaveLine = (lineId: string, text: string): void => {
    onUpdateLine(lineId, { text });
    setEditingLineId(null);
  };

  const getCharacterColor = (characterName: string): string => {
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < characterName.length; i++) {
      hash = characterName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Toolbar */}
      <div className='border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <MessageSquare className='h-5 w-5 text-primary' />
            <h2 className='text-lg font-semibold'>Dialogue Editor</h2>
            <span className='text-sm text-muted-foreground'>{lines.length} lines</span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={settings.showLineNumbers ? 'default' : 'outline'}
              size='sm'
              onClick={() => onSettingsChange({ showLineNumbers: !settings.showLineNumbers })}
            >
              Line Numbers
            </Button>
            <Button
              variant={settings.highlightIssues ? 'default' : 'outline'}
              size='sm'
              onClick={() => onSettingsChange({ highlightIssues: !settings.highlightIssues })}
            >
              Highlight Issues
            </Button>
            <Button
              variant={settings.showCharacterColors ? 'default' : 'outline'}
              size='sm'
              onClick={() =>
                onSettingsChange({
                  showCharacterColors: !settings.showCharacterColors,
                })
              }
            >
              Character Colors
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogue Lines */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-4xl space-y-4'>
          {lines.map((line, index) => {
            const isSelected = selectedLineId === line.id;
            const isEditing = editingLineId === line.id;
            const characterColor = settings.showCharacterColors
              ? getCharacterColor(line.characterName)
              : undefined;

            return (
              <Card
                key={line.id}
                className={cn('p-4 transition-all', isSelected && 'ring-2 ring-primary')}
                onClick={() => handleLineClick(line.id)}
              >
                <div className='flex gap-4'>
                  {settings.showLineNumbers && (
                    <div className='w-8 flex-shrink-0 text-right text-sm text-muted-foreground'>
                      {index + 1}
                    </div>
                  )}

                  <div className='flex-1 space-y-2'>
                    {/* Character Name */}
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <span
                        className='font-medium'
                        style={characterColor ? { color: characterColor } : undefined}
                      >
                        {line.characterName}
                      </span>
                      <span className='text-xs text-muted-foreground'>{line.tag}</span>
                    </div>

                    {/* Dialogue Text */}
                    {isEditing ? (
                      <div className='space-y-2'>
                        <textarea
                          className='w-full rounded border p-2 font-serif text-base'
                          rows={3}
                          defaultValue={line.text}
                          onBlur={e => handleSaveLine(line.id, e.target.value)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className='font-serif text-base leading-relaxed'>"{line.text}"</p>
                    )}

                    {/* Action Beat */}
                    {line.action && (
                      <p className='text-sm italic text-muted-foreground'>{line.action}</p>
                    )}

                    {/* Actions when selected */}
                    {isSelected && !isEditing && (
                      <div className='flex gap-2 pt-2'>
                        <Button size='sm' variant='outline' onClick={() => handleEditLine(line.id)}>
                          Edit
                        </Button>
                        <Button size='sm' variant='outline'>
                          <Tag className='mr-2 h-4 w-4' />
                          Change Tag
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {lines.length === 0 && (
            <div className='py-12 text-center'>
              <MessageSquare className='mx-auto h-12 w-12 text-muted-foreground' />
              <p className='mt-4 text-muted-foreground'>No dialogue found in this chapter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
