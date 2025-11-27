/**
 * Chapter Editor Component - Extracted from BookViewer
 * Handles chapter content editing and operations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  Save,
  Wand2,
  Play,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Project, Chapter } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';

interface ChapterEditorProps {
  project: Project;
  selectedChapterId: string | null;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onRefineChapter?: (chapterId: string, options: any) => void;
  onContinueChapter?: (chapterId: string) => void;
  className?: string;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  project,
  selectedChapterId,
  onUpdateChapter,
  onRefineChapter,
  onContinueChapter,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'summary' | 'content' | null>(null);
  const [tempValues, setTempValues] = useState<{
    title?: string;
    summary?: string;
    content?: string;
  }>({});
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedChapter = selectedChapterId && selectedChapterId !== 'overview' 
    ? project.chapters.find(c => c.id === selectedChapterId)
    : null;

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editingField]);

  const handleStartEdit = (field: 'title' | 'summary' | 'content', currentValue: string) => {
    setEditingField(field);
    setIsEditing(true);
    setTempValues({ [field]: currentValue });
  };

  const handleSaveEdit = () => {
    if (selectedChapter && editingField && tempValues[editingField] !== undefined) {
      const updates: Partial<Chapter> = {
        [editingField]: tempValues[editingField],
        updatedAt: new Date()
      };

      // If content is being updated, recalculate word count
      if (editingField === 'content') {
        updates.wordCount = tempValues.content?.split(/\s+/).length || 0;
        updates.characterCount = tempValues.content?.length || 0;
      }

      onUpdateChapter(selectedChapter.id, updates);
    }
    
    setIsEditing(false);
    setEditingField(null);
    setTempValues({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingField(null);
    setTempValues({});
  };

  const handleRefine = () => {
    if (selectedChapter && onRefineChapter) {
      onRefineChapter(selectedChapter.id, {
        focus: ['grammar', 'style', 'flow'],
        preserveLength: true,
        targetTone: 'consistent'
      });
    }
  };

  const handleContinue = () => {
    if (selectedChapter && onContinueChapter) {
      onContinueChapter(selectedChapter.id);
    }
  };

  if (!selectedChapter) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Chapter Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a chapter from the list to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Chapter Header */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Chapter Title
          </label>
          {editingField === 'title' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={tempValues.title || ''}
                onChange={(e) => setTempValues({ ...tempValues, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter chapter title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="w-3 h-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => handleStartEdit('title', selectedChapter.title)}
              className="w-full px-3 py-2 bg-card/50 border border-border/50 rounded-lg cursor-pointer hover:bg-card hover:border-border transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-foreground">
                  {selectedChapter.title || 'Untitled Chapter'}
                </span>
                <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Chapter Summary
          </label>
          {editingField === 'summary' ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={tempValues.summary || ''}
                onChange={(e) => setTempValues({ ...tempValues, summary: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Enter chapter summary..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="w-3 h-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => handleStartEdit('summary', selectedChapter.summary || '')}
              className="w-full px-3 py-2 bg-card/50 border border-border/50 rounded-lg cursor-pointer hover:bg-card hover:border-border transition-colors group min-h-[80px]"
            >
              <div className="flex items-start justify-between">
                <span className="text-foreground text-sm">
                  {selectedChapter.summary || 'Click to add a summary...'}
                </span>
                <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleRefine}
          disabled={!selectedChapter.content || isEditing}
        >
          <Wand2 className="w-3 h-3" />
          Refine
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleContinue}
          disabled={isEditing}
        >
          <Play className="w-3 h-3" />
          Continue
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {/* Handle rewrite */}}
          disabled={isEditing}
        >
          <RefreshCw className="w-3 h-3" />
          Rewrite
        </Button>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Chapter Content
        </label>
        {editingField === 'content' ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={tempValues.content || ''}
              onChange={(e) => setTempValues({ ...tempValues, content: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[300px] font-mono text-sm"
              placeholder="Start writing your chapter content..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-3 h-3" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Words: {tempValues.content?.split(/\s+/).length || 0} | 
              Characters: {tempValues.content?.length || 0}
            </div>
          </div>
        ) : (
          <div 
            onClick={() => handleStartEdit('content', selectedChapter.content)}
            className="w-full px-3 py-2 bg-card/50 border border-border/50 rounded-lg cursor-pointer hover:bg-card hover:border-border transition-colors group min-h-[300px]"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Content</span>
              <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap font-mono">
              {selectedChapter.content || 'Click to start writing...'}
            </div>
            {selectedChapter.content && (
              <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                Words: {selectedChapter.wordCount || 0} | 
                Characters: {selectedChapter.characterCount || 0}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterEditor;