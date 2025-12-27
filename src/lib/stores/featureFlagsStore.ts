import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { experiments } from '@/lib/analytics/experiments';

interface FeatureFlagState {
  flags: Record<string, boolean | string>;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  isFlagEnabled: (flag: string, defaultValue?: boolean) => boolean;
  getFlagValue: (flag: string) => boolean | string | null;
  setFlagOverride: (flag: string, value: boolean | string) => void;
  reloadFlags: () => Promise<void>;
  resetFlags: () => void;
}

export const useFeatureFlagsStore = create<FeatureFlagState>()(
  devtools(
    persist(
      (set, get) => ({
        flags: {},
        isLoading: false,
        error: null,

        initialize: async (): Promise<void> => {
          set({ isLoading: true, error: null });
          try {
            await experiments.init();
            const flags = experiments.getAllFeatureFlags() as Record<string, boolean | string>;
            set({ flags, isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to initialize feature flags',
              isLoading: false,
            });
          }
        },

        isFlagEnabled: (flag, defaultValue = false): boolean => {
          const { flags } = get();
          const flagValue = flags[flag];

          if (typeof flagValue === 'boolean') {
            return flagValue;
          }

          if (typeof flagValue === 'string') {
            return flagValue === 'true' || flagValue === 'enabled' || flagValue === '1';
          }

          return defaultValue;
        },

        getFlagValue: (flag): boolean | string | null => {
          const { flags } = get();
          return flags[flag] ?? null;
        },

        setFlagOverride: (flag, value): void => {
          set(state => ({
            flags: {
              ...state.flags,
              [flag]: value,
            },
          }));
        },

        reloadFlags: async (): Promise<void> => {
          set({ isLoading: true, error: null });
          try {
            await experiments.reloadFeatureFlags();
            const flags = experiments.getAllFeatureFlags() as Record<string, boolean | string>;
            set({ flags, isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to reload feature flags',
              isLoading: false,
            });
          }
        },

        resetFlags: (): void => {
          set({ flags: {}, error: null });
        },
      }),
      {
        name: 'feature-flags-storage',
        partialize: state => ({
          flags: state.flags,
        }),
      },
    ),
    { name: 'FeatureFlagsStore' },
  ),
);

export const selectFlagEnabled =
  (flag: string, defaultValue = false) =>
  (state: FeatureFlagState): boolean =>
    state.isFlagEnabled(flag, defaultValue);

export const selectFlagValue =
  (flag: string) =>
  (state: FeatureFlagState): boolean | string | null =>
    state.getFlagValue(flag);
