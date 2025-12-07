import React, { useEffect, useState } from 'react';
import type { Project, TimelineEvent } from '@/types/schemas';
import { useTimelineStore } from '../stores/timelineStore';
import { TimelineCanvas } from './TimelineCanvas';
import { Button } from '@/components/ui/Button';
import { Plus, ZoomIn, ZoomOut, Calendar } from 'lucide-react';

interface TimelineViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ project, onUpdateProject }) => {
  const { timeline, setTimeline, addEvent, selectedEventId, selectEvent } = useTimelineStore();

  const [zoom, setZoom] = useState(1);

  // Sync project timeline to store on mount or project change
  useEffect(() => {
    if (project.timeline) {
      setTimeline(project.timeline);
    } else {
      // Initialize default timeline if missing (migration strategy)
      if (project.id) {
        setTimeline({
          id: crypto.randomUUID(),
          projectId: project.id,
          events: [],
          eras: [],
          settings: {
            viewMode: 'chronological',
            zoomLevel: 1,
            showCharacters: true,
            showImplicitEvents: false,
          },
        });
      }
    }
  }, [project, setTimeline]);

  // Sync store changes back to project (Debounced or on unmount ideally, but for now simple effect)
  // Note: This might cause cycles if not careful.
  // For this MVP, we might rely on specific save actions or just let the store be the source of truth
  // and have a "Save Timeline" button, or update project on every change.
  // Given 'onUpdateProject' exists, we should use it.

  // Actually, useTimelineStore updates local state.
  // We should listen to store changes and call onUpdateProject.
  // But zustand doesn't easily expose a "on change" listener for the whole state outside of effects.

  useEffect(() => {
    if (timeline) {
      // Check if timeline is different from project.timeline to avoid loops?
      // For now, let's assume this effect runs when timeline changes.
      // We need to be careful not to trigger infinite loops if onUpdateProject causes project prop update
      // which causes setTimeline.

      if (JSON.stringify(timeline) !== JSON.stringify(project.timeline)) {
        // Avoid deep comparison if possible, but for safety in MVP:
        // We will assume that if we are editing in TimelineView, we want to push up.
        onUpdateProject({ timeline });
      }
    }
  }, [timeline, onUpdateProject, project.timeline]);

  const handleAddEvent = () => {
    const newEvent: Omit<TimelineEvent, 'id'> = {
      title: 'New Event',
      description: 'Event description...',
      chronologicalIndex: timeline?.events.length ? timeline.events.length + 1 : 1,
      charactersInvolved: [],
      tags: [],
      importance: 'minor',
    };
    addEvent(newEvent);
  };

  if (!timeline)
    return <div className='flex h-full items-center justify-center'>Loading Timeline...</div>;

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm'>
      {/* Toolbar */}
      <div className='flex items-center justify-between border-b bg-muted/30 p-4'>
        <div className='flex items-center gap-2'>
          <h2 className='flex items-center gap-2 text-lg font-semibold'>
            <Calendar className='h-5 w-5' />
            Timeline
          </h2>
          <div className='mx-2 h-6 w-px bg-border' />
          <div className='flex rounded-md bg-muted p-1'>
            <Button
              variant={zoom > 0.5 ? 'default' : 'outline'}
              size='sm'
              className='h-7 px-2'
              onClick={() => setZoom(1)}
            >
              Standard
            </Button>
            <Button
              variant={zoom < 0.5 ? 'default' : 'outline'}
              size='sm'
              className='h-7 px-2'
              onClick={() => setZoom(0.4)}
            >
              Compact
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <span className='w-12 text-center font-mono text-xs'>{Math.round(zoom * 100)}%</span>
          <Button variant='outline' size='icon' onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className='h-4 w-4' />
          </Button>
          <Button onClick={handleAddEvent} className='ml-2 gap-2'>
            <Plus className='h-4 w-4' />
            Add Event
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className='relative w-full flex-1'>
        <TimelineCanvas
          events={timeline.events}
          selectedEventId={selectedEventId}
          onEventClick={selectEvent}
        />
      </div>
    </div>
  );
};
