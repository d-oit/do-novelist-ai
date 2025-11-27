/**
 * Analytics Dashboard - Refactored to use smaller components
 * Main container for analytics views
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Project, ChapterStatus } from '../../../types';

import { Button } from '../../../components/ui/Button';
import AnalyticsSidebar from './AnalyticsSidebar';
import AnalyticsContent from './AnalyticsContent';
import { cn } from '../../../lib/utils';

interface AnalyticsDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

const AnalyticsDashboardRefactored: React.FC<AnalyticsDashboardProps> = ({
  project,
  onClose,
  className
}) => {
  const [activeView, setActiveView] = useState('overview');
  const [isCompact, setIsCompact] = useState(false);

  const handleExport = () => {
    // Export analytics data
    const data = {
      project: project.title,
      exportDate: new Date().toISOString(),
      chapters: project.chapters.length,
      totalWords: project.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0),
      completed: project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length

    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}-analytics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
        className
      )}
    >
      <div className={cn(
        "bg-background border border-border rounded-lg shadow-2xl",
        "w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Analytics Dashboard</h2>
            <span className="text-sm text-muted-foreground">
              {project.title}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCompact(!isCompact)}
            >
              {isCompact ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isCompact ? 'Detailed' : 'Compact'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* Handle refresh */}}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border/50 bg-card/20 p-4 overflow-y-auto">
            <AnalyticsSidebar
              project={project}
              activeView={activeView}
              onViewChange={setActiveView}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <AnalyticsContent
              project={project}
              activeView={activeView}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboardRefactored;