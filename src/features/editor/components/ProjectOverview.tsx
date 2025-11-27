/**
 * Project Overview Component - Extracted from BookViewer
 * Handles project details and metadata editing
 */

import React, { useState } from 'react';
import { Edit3, Save, Book, User, Globe } from 'lucide-react';
import { Project, ChapterStatus } from '../../../types';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';

interface ProjectOverviewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  className?: string;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  onUpdateProject,
  className
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  const handleStartEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setTempValues({ [field]: currentValue });
  };

  const handleSaveEdit = () => {
    if (editingField && tempValues[editingField] !== undefined) {
      onUpdateProject({
        [editingField]: tempValues[editingField],
        updatedAt: new Date()
      });
    }
    
    setEditingField(null);
    setTempValues({});
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const EditableField: React.FC<{
    field: string;
    label: string;
    value: any;
    type?: 'text' | 'textarea' | 'select';
    options?: string[];
    placeholder?: string;
    icon?: React.ReactNode;
  }> = ({ field, label, value, type = 'text', options, placeholder, icon }) => {
    const isEditing = editingField === field;
    
    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
          {type === 'textarea' ? (
            <textarea
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder={placeholder}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
          ) : type === 'select' ? (
            <select
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
          )}
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
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <div 
          onClick={() => handleStartEdit(field, value)}
          className="w-full px-3 py-2 bg-card/50 border border-border/50 rounded-lg cursor-pointer hover:bg-card hover:border-border transition-colors group"
        >
          <div className="flex items-center gap-3">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="flex-1 text-foreground">
              {value || placeholder || `Click to add ${label.toLowerCase()}...`}
            </span>
            <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground">Project Overview</h2>
        <p className="text-muted-foreground">
          Manage your project details and settings
        </p>
      </div>

      <div className="space-y-6">
        <EditableField
          field="title"
          label="Project Title"
          value={project.title}
          icon={<Book className="w-4 h-4" />}
          placeholder="Enter project title"
        />

        <EditableField
          field="idea"
          label="Project Idea"
          value={project.idea}
          type="textarea"
          placeholder="Describe your story idea..."
        />

        <EditableField
          field="synopsis"
          label="Synopsis"
          value={project.synopsis}
          type="textarea"
          placeholder="Write a brief synopsis of your story..."
        />

        <EditableField
          field="style"
          label="Writing Style"
          value={project.style}
          type="select"
          icon={<Globe className="w-4 h-4" />}
          options={[
            'General Fiction',
            'Literary Fiction',
            'Mystery & Thriller',
            'Romance',
            'Science Fiction',
            'Fantasy',
            'Horror',
            'Historical Fiction',
            'Young Adult',
            'Children\'s Literature',
            'Biography',
            'Self-Help',
            'Business',
            'Technical Writing'
          ]}
        />

        <EditableField
          field="targetWordCount"
          label="Target Word Count"
          value={project.targetWordCount?.toString()}
          placeholder="50000"
        />

        <EditableField
          field="language"
          label="Language"
          value={project.language}
          type="select"
          icon={<Globe className="w-4 h-4" />}
          options={['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh']}
        />

        <EditableField
          field="targetAudience"
          label="Target Audience"
          value={project.targetAudience}
          type="select"
          icon={<User className="w-4 h-4" />}
          options={['children', 'young_adult', 'adult', 'all_ages']}
        />
      </div>

      {/* Project Statistics */}
      <div className="mt-8 p-4 bg-card/30 rounded-lg border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Project Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{project.chapters.length}</div>
            <div className="text-sm text-muted-foreground">Chapters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {project.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length}

            </div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round((project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length / Math.max(1, project.chapters.length)) * 100)}%

            </div>
            <div className="text-sm text-muted-foreground">Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;