import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Timeline, TimelineEvent, TimelineEra } from '@/types';

interface TimelineState {
  timeline: Timeline | null;
  selectedEventId: string | null;
  isDragging: boolean;

  // Actions
  setTimeline: (timeline: Timeline) => void;
  updateSettings: (settings: Partial<Timeline['settings']>) => void;

  // Event Actions
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  removeEvent: (eventId: string) => void;
  reorderEvent: (eventId: string, newIndex: number) => void;

  // Era Actions
  addEra: (era: Omit<TimelineEra, 'id'>) => void;
  updateEra: (eraId: string, updates: Partial<TimelineEra>) => void;
  removeEra: (eraId: string) => void;

  // Selection
  selectEvent: (eventId: string | null) => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    set => ({
      timeline: null,
      selectedEventId: null,
      isDragging: false,

      setTimeline: timeline => set({ timeline }),

      updateSettings: settingsUpdates =>
        set(state => {
          if (!state.timeline) return state;
          return {
            timeline: {
              ...state.timeline,
              settings: { ...state.timeline.settings, ...settingsUpdates },
            },
          };
        }),

      addEvent: eventData =>
        set(state => {
          if (!state.timeline) return state;
          const newEvent: TimelineEvent = {
            ...eventData,
            id: crypto.randomUUID(),
          };
          return {
            timeline: {
              ...state.timeline,
              events: [...state.timeline.events, newEvent],
            },
          };
        }),

      updateEvent: (eventId, updates) =>
        set(state => {
          if (!state.timeline) return state;
          return {
            timeline: {
              ...state.timeline,
              events: state.timeline.events.map(e => (e.id === eventId ? { ...e, ...updates } : e)),
            },
          };
        }),

      removeEvent: eventId =>
        set(state => {
          if (!state.timeline) return state;
          return {
            timeline: {
              ...state.timeline,
              events: state.timeline.events.filter(e => e.id !== eventId),
            },
          };
        }),

      reorderEvent: (eventId, newIndex) =>
        set(state => {
          if (!state.timeline) return state;
          // This is a naive implementation; normally reordering involves shifting indices
          // For now we just update the chronologicalIndex of the specific event.
          // A real robust implementation might need to shift others.
          // But if 'chronologicalIndex' is just a sort key, this is fine.
          return {
            timeline: {
              ...state.timeline,
              events: state.timeline.events.map(e =>
                e.id === eventId ? { ...e, chronologicalIndex: newIndex } : e,
              ),
            },
          };
        }),

      addEra: eraData =>
        set(state => {
          if (!state.timeline) return state;
          const newEra: TimelineEra = {
            ...eraData,
            id: crypto.randomUUID(),
          };
          return {
            timeline: {
              ...state.timeline,
              eras: [...state.timeline.eras, newEra],
            },
          };
        }),

      updateEra: (eraId, updates) =>
        set(state => {
          if (!state.timeline) return state;
          return {
            timeline: {
              ...state.timeline,
              eras: state.timeline.eras.map(e => (e.id === eraId ? { ...e, ...updates } : e)),
            },
          };
        }),

      removeEra: eraId =>
        set(state => {
          if (!state.timeline) return state;
          return {
            timeline: {
              ...state.timeline,
              eras: state.timeline.eras.filter(e => e.id !== eraId),
            },
          };
        }),

      selectEvent: eventId => set({ selectedEventId: eventId }),
    }),
    {
      name: 'timeline-storage',
      partialize: state => ({
        // Only persist timeline settings and maybe view state?
        // Actually, timeline data should come from the project.
        // But if we want local persistence for UI state:
        selectedEventId: state.selectedEventId,
      }),
    },
  ),
);
