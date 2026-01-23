/**
 * Chapter Editor Component - Extracted from BookViewer
 * Handles chapter content editing and operations
 */

import {
  Edit3,
  Save,
  Wand2,
  Play,
  RefreshCw,
  FileText,
  Brain,
  PanelRightOpen,
  PanelRightClose,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { useUndoRedo } from '@/features/editor/hooks/useUndoRedo';
import { WritingAssistantPanel } from '@/features/writing-assistant/components/WritingAssistantPanel';
import { useAnalytics, useFeatureAction } from '@/lib/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import type { Project, Chapter, RefineOptions } from '@/types';

interface ChapterEditorProps {
  project: Project;
  selectedChapterId: string | null;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onRefineChapter?: (chapterId: string, options: RefineOptions) => void;
  onContinueChapter?: (chapterId: string) => void;
  className?: string;
}

const ChapterEditor: FC<ChapterEditorProps> = ({
  project,
  selectedChapterId,
  onUpdateChapter,
  onRefineChapter,
  onContinueChapter,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'summary' | 'content' | null>(null);
  const [tempValues, setTempValues] = useState<{
    title?: string;
    summary?: string;
    content?: string;
  }>({});
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);

  // Use undo/redo hook for content editing
  useAnalytics({ feature: 'editor', trackTimeInFeature: true });
  const { trackAction } = useFeatureAction('editor');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedChapter: Chapter | undefined =
    selectedChapterId !== null && selectedChapterId !== 'overview'
      ? project.chapters.find(c => c.id === selectedChapterId)
      : undefined;

  // Initialize undo/redo hook for content editing
  const initialContent = selectedChapter?.content ?? '';
  const undoRedo = useUndoRedo(initialContent, { maxHistory: 50 });

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editingField]);

  // Reset undo/redo state when chapter changes
  useEffect(() => {
    undoRedo.reset();
  }, [selectedChapterId, undoRedo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Only handle keyboard shortcuts when not in edit mode and Ctrl/Cmd key is pressed
      if (!isEditing && (e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undoRedo.undo();
        } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && undoRedo.canRedo) {
          e.preventDefault();
          undoRedo.redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undoRedo]);

  const handleStartEdit = (field: 'title' | 'summary' | 'content', currentValue: string): void => {
    setEditingField(field);
    setIsEditing(true);

    // Initialize temp values
    if (field === 'content') {
      // Reset undo/redo when starting content edit
      undoRedo.reset();
    } else {
      setTempValues({ [field]: currentValue });
    }
    trackAction('start_edit', { field });
  };

  const handleSaveEdit = useCallback((): void => {
    if (selectedChapter && editingField) {
      const updates: Partial<Chapter> = {
        updatedAt: new Date(),
      };

      // For content, use undo/redo state. For title/summary, use tempValues.
      if (editingField === 'content') {
        updates.content = undoRedo.state;
        updates.wordCount = undoRedo.state.split(/\s+/).length;
        updates.characterCount = undoRedo.state.length;
      } else {
        updates[editingField] = tempValues[editingField];
      }

      onUpdateChapter(selectedChapter.id, updates);
      trackAction('save_edit', { field: editingField });
    }

    setIsEditing(false);
    setEditingField(null);
    setTempValues({});
  }, [selectedChapter, editingField, undoRedo, tempValues, onUpdateChapter, trackAction]);

  const handleCancelEdit = useCallback((): void => {
    setIsEditing(false);
    setEditingField(null);
    trackAction('cancel_edit', { field: editingField });
    setTempValues({});
    if (editingField === 'content') {
      undoRedo.reset();
    }
  }, [editingField, trackAction, undoRedo]);

  const handleContentChange = (newContent: string): void => {
    undoRedo.set(newContent);
  };

  const handleRefine = (): void => {
    if (selectedChapter && onRefineChapter) {
      onRefineChapter(selectedChapter.id, {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.95,
        focusAreas: ['grammar', 'style', 'pacing'],
        preserveLength: true,
      });
    }
  };

  const handleContinue = (): void => {
    if (selectedChapter && onContinueChapter) {
      onContinueChapter(selectedChapter.id);
    }
  };

  if (!selectedChapter) {
    return (
      <div className={cn('flex h-64 items-center justify-center', className)}>
        <div className='text-center'>
          <FileText className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
          <h3 className='mb-2 text-lg font-medium text-foreground'>No Chapter Selected</h3>
          <p className='text-sm text-muted-foreground'>
            Select a chapter from the list to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Main Editor Panel */}
      <div className={cn('flex-1 space-y-6', showWritingAssistant ? 'lg:w-2/3' : 'w-full')}>
        {/* Writing Assistant Toggle Button */}
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>{selectedChapter.title ?? 'Untitled Chapter'}</h2>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setShowWritingAssistant(!showWritingAssistant)}
          >
            <Brain className='mr-2 h-4 w-4' />
            AI Assistant
            {showWritingAssistant ? (
              <PanelRightClose className='ml-2 h-4 w-4' />
            ) : (
              <PanelRightOpen className='ml-2 h-4 w-4' />
            )}
          </Button>
        </div>

        {/* Chapter Header */}
        <div className='space-y-4'>
          {/* Title */}
          <div>
            <label className='mb-2 block text-sm font-medium text-foreground'>Chapter Title</label>
            {editingField === 'title' ? (
              <div className='space-y-2'>
                <input
                  type='text'
                  value={tempValues.title ?? ''}
                  onChange={e => setTempValues({ ...tempValues, title: e.target.value })}
                  className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary'
                  placeholder='Enter chapter title...'
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className='flex gap-2'>
                  <Button size='sm' onClick={handleSaveEdit}>
                    <Save className='h-3 w-3' />
                    Save
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleStartEdit('title', selectedChapter.title ?? '')}
                className='group w-full cursor-pointer rounded-lg border border-border/50 bg-card/50 px-3 py-2 transition-colors hover:border-border hover:bg-card'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-foreground'>
                    {selectedChapter.title ?? 'Untitled Chapter'}
                  </span>
                  <Edit3 className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className='mb-2 block text-sm font-medium text-foreground'>
              Chapter Summary
            </label>
            {editingField === 'summary' ? (
              <div className='space-y-2'>
                <textarea
                  ref={textareaRef}
                  value={tempValues.summary ?? ''}
                  onChange={e => setTempValues({ ...tempValues, summary: e.target.value })}
                  className='w-full resize-none rounded-lg border border-border bg-background px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary'
                  placeholder='Enter chapter summary...'
                  rows={3}
                  onKeyDown={e => {
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className='flex gap-2'>
                  <Button size='sm' onClick={handleSaveEdit}>
                    <Save className='h-3 w-3' />
                    Save
                  </Button>
                  <Button size='sm' variant='outline' onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleStartEdit('summary', selectedChapter.summary ?? '')}
                className='group min-h-[80px] w-full cursor-pointer rounded-lg border border-border/50 bg-card/50 px-3 py-2 transition-colors hover:border-border hover:bg-card'
              >
                <div className='flex items-start justify-between'>
                  <span className='text-sm text-foreground'>
                    {selectedChapter.summary ?? 'Click to add a summary...'}
                  </span>
                  <Edit3 className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Actions */}
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleRefine}
            disabled={!selectedChapter.content || isEditing}
          >
            <Wand2 className='h-3 w-3' />
            Refine
          </Button>
          <Button size='sm' variant='outline' onClick={handleContinue} disabled={isEditing}>
            <Play className='h-3 w-3' />
            Continue
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              /* Handle rewrite */
            }}
            disabled={isEditing}
          >
            <RefreshCw className='h-3 w-3' />
            Rewrite
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => undoRedo.undo()}
            disabled={!undoRedo.canUndo || isEditing}
            title='Undo (Ctrl+Z / Cmd+Z)'
          >
            <Undo2 className='h-3 w-3' />
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => undoRedo.redo()}
            disabled={!undoRedo.canRedo || isEditing}
            title='Redo (Ctrl+Y / Cmd+Y)'
          >
            <Redo2 className='h-3 w-3' />
          </Button>
        </div>

        {/* Content Editor */}
        <div>
          <label className='mb-2 block text-sm font-medium text-foreground'>Chapter Content</label>
          {editingField === 'content' ? (
            <div className='space-y-2'>
              <textarea
                ref={textareaRef}
                value={undoRedo.state}
                onChange={e => handleContentChange(e.target.value)}
                className='min-h-[300px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-primary'
                placeholder='Start writing your chapter content...'
              />
              <div className='flex gap-2'>
                <Button size='sm' onClick={handleSaveEdit}>
                  <Save className='h-3 w-3' />
                  Save
                </Button>
                <Button size='sm' variant='outline' onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                  Words: {undoRedo.state.split(/\s+/).length} | Characters: {undoRedo.state.length}
                </span>
                <span>
                  History: {undoRedo.canUndo ? 'Undo available' : 'No undo'} |{' '}
                  {undoRedo.canRedo ? 'Redo available' : 'No redo'}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleStartEdit('content', selectedChapter.content ?? '')}
              className='group min-h-[300px] w-full cursor-pointer rounded-lg border border-border/50 bg-card/50 px-3 py-2 transition-colors hover:border-border hover:bg-card'
            >
              <div className='mb-2 flex items-start justify-between'>
                <span className='text-sm font-medium text-foreground'>Content</span>
                <Edit3 className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
              </div>
              <div className='whitespace-pre-wrap font-mono text-sm text-foreground'>
                {selectedChapter.content ?? 'Click to start writing...'}
              </div>
              {selectedChapter.content && (
                <div className='mt-2 border-t border-border/50 pt-2 text-xs text-muted-foreground'>
                  Words: {selectedChapter.wordCount ?? 0} | Characters:{' '}
                  {selectedChapter.characterCount ?? 0}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Writing Assistant Panel */}
      {showWritingAssistant && (
        <div className='w-full min-w-[350px] border-l border-border pl-6 lg:w-1/3'>
          <WritingAssistantPanel
            content={selectedChapter.content}
            chapterId={selectedChapter.id}
            projectId={project.id}
            characterContext={[]}
            plotContext={project.idea ?? ''}
            className='sticky top-6'
          />
        </div>
      )}
    </div>
  );
};

export default ChapterEditor;
