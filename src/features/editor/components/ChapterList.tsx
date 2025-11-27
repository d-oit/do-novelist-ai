/**
 * Chapter List Component - Extracted from BookViewer
 * Handles chapter navigation and overview display
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Eye } from 'lucide-react';
import { Project, Chapter, ChapterStatus } from '../../../types';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';

interface ChapterListProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  className?: string;
}

const ChapterList: React.FC<ChapterListProps> = ({
  project,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  className
}) => {
  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case ChapterStatus.COMPLETE:
        return 'bg-green-500/20 text-green-400 ring-green-500/30';
      case ChapterStatus.DRAFTING:
        return 'bg-blue-500/20 text-blue-400 ring-blue-500/30';
      case ChapterStatus.REVIEW:
        return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 ring-slate-500/30';
    }
  };

  const getStatusText = (status: Chapter['status']) => {
    switch (status) {
      case ChapterStatus.PENDING:
        return 'Pending';
      case ChapterStatus.DRAFTING:
        return 'Drafting';
      case ChapterStatus.REVIEW:
        return 'Review';
      case ChapterStatus.COMPLETE:
        return 'Complete';
      default:
        return 'Unknown';
    }
  };


  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Chapters</h3>
        <Button
          onClick={onAddChapter}
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Chapter
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {/* Overview Item */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectChapter('overview')}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-all",
            "border border-border/50 hover:border-primary/50",
            selectedChapterId === 'overview' 
              ? "bg-primary/10 border-primary shadow-md shadow-primary/10" 
              : "bg-card/50 hover:bg-card"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">Project Overview</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Project details and settings
              </p>
            </div>
          </div>
        </motion.button>

        {/* Chapter Items */}
        {project.chapters
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((chapter, index) => (
            <motion.button
              key={chapter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChapter(chapter.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all",
                "border border-border/50 hover:border-primary/50",
                selectedChapterId === chapter.id 
                  ? "bg-primary/10 border-primary shadow-md shadow-primary/10" 
                  : "bg-card/50 hover:bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {index + 1}. {chapter.title || 'Untitled Chapter'}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium ring-1",
                      getStatusColor(chapter.status)
                    )}>
                      {getStatusText(chapter.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {chapter.summary || chapter.content 
                      ? (chapter.summary || chapter.content.substring(0, 60) + '...')
                      : 'No content yet'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {chapter.wordCount || 0} words
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
      </div>
    </div>
  );
};

export default ChapterList;