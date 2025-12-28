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
} from 'lucide-react';
import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

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

  useAnalytics({ feature: 'editor', trackTimeInFeature: true });
  const { trackAction } = useFeatureAction('editor');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedChapter: Chapter | undefined =
    selectedChapterId !== null && selectedChapterId !== 'overview'
      ? project.chapters.find(c => c.id === selectedChapterId)
      : undefined;

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editingField]);

  const handleStartEdit = (field: 'title' | 'summary' | 'content', currentValue: string): void => {
    setEditingField(field);
    setIsEditing(true);
    setTempValues({ [field]: currentValue });
    trackAction('start_edit', { field });
  };

  const handleSaveEdit = (): void => {
    if (selectedChapter && editingField && tempValues[editingField] !== undefined) {
      const updates: Partial<Chapter> = {
        [editingField]: tempValues[editingField],
        updatedAt: new Date(),
      };

      // If content is being updated, recalculate word count
      if (editingField === 'content') {
        updates.wordCount = tempValues.content?.split(/\s+/).length ?? 0;
        updates.characterCount = tempValues.content?.length ?? 0;
      }

      onUpdateChapter(selectedChapter.id, updates);
      trackAction('save_edit', { field: editingField });
    }

    setIsEditing(false);
    setEditingField(null);
    setTempValues({});
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setEditingField(null);
    trackAction('cancel_edit', { field: editingField });
    setTempValues({});
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
                onClick={() => handleStartEdit('title', selectedChapter.title)}
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
        </div>

        {/* Content Editor */}
        <div>
          <label className='mb-2 block text-sm font-medium text-foreground'>Chapter Content</label>
          {editingField === 'content' ? (
            <div className='space-y-2'>
              <textarea
                ref={textareaRef}
                value={tempValues.content ?? ''}
                onChange={e => setTempValues({ ...tempValues, content: e.target.value })}
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
              <div className='text-xs text-muted-foreground'>
                Words: {tempValues.content?.split(/\s+/).length ?? 0} | Characters:{' '}
                {tempValues.content?.length ?? 0}
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleStartEdit('content', selectedChapter.content)}
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
