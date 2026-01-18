import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@/contexts/UserContext';
import { getUserSettings, updateUserSettings } from '@/lib/database/services/user-settings-service';
import { logger } from '@/lib/logging/logger';

const ONBOARDING_STORAGE_KEY = 'novelist-onboarding-completed';
const ONBOARDING_STEP_KEY = 'novelist-onboarding-step';

export type OnboardingStep =
  | 'welcome'
  | 'create-project'
  | 'explore-dashboard'
  | 'ai-features'
  | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'create-project', 'explore-dashboard', 'ai-features'];

interface UseOnboardingReturn {
  /** Whether onboarding has been completed */
  isCompleted: boolean;
  /** Whether onboarding modal should be shown */
  isOpen: boolean;
  /** Current step in onboarding flow */
  currentStep: OnboardingStep;
  /** Total number of steps (excluding complete) */
  totalSteps: number;
  /** Current step number (1-indexed) */
  currentStepNumber: number;
  /** Start onboarding flow */
  startOnboarding: () => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  previousStep: () => void;
  /** Skip to a specific step */
  goToStep: (step: OnboardingStep) => void;
  /** Complete and close onboarding */
  completeOnboarding: () => Promise<void>;
  /** Skip onboarding without completing */
  skipOnboarding: () => Promise<void>;
  /** Reset onboarding to show again */
  resetOnboarding: () => Promise<void>;
  /** Close modal temporarily */
  closeModal: () => void;
}

/**
 * Hook for managing onboarding flow.
 *
 * Usage:
 * ```tsx
 * const { isOpen, currentStep, nextStep, completeOnboarding } = useOnboarding();
 *
 * if (isOpen) {
 *   return <OnboardingModal step={currentStep} onNext={nextStep} />;
 * }
 * ```
 */
export function useOnboarding(): UseOnboardingReturn {
  const { userId } = useUser();
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load onboarding state from Turso on mount
  useEffect(() => {
    const loadState = async (): Promise<void> => {
      try {
        const settings = await getUserSettings(userId);

        if (settings) {
          const completed = settings.onboardingComplete;
          const step = settings.onboardingStep as OnboardingStep;

          setIsCompleted(completed);
          setCurrentStep(completed ? 'complete' : step || 'welcome');
          setIsOpen(!completed);
        }
      } catch (error) {
        logger.error('Failed to load onboarding state from Turso, using localStorage fallback', {
          error,
        });
        // Fallback to localStorage if Turso fails
        try {
          const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
          const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
          if (saved && STEPS.includes(saved as OnboardingStep)) {
            setCurrentStep(saved as OnboardingStep);
          } else {
            setCurrentStep('welcome');
          }
          setIsCompleted(completed);
          setIsOpen(!completed);
        } catch (localError) {
          logger.error('Failed to load onboarding state from localStorage', { error: localError });
          setIsCompleted(false);
          setCurrentStep('welcome');
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadState();
  }, [userId]);

  // Persist step to Turso (debounced to avoid excessive writes)
  useEffect(() => {
    if (isLoading) return;

    const saveStep = async (): Promise<void> => {
      try {
        await updateUserSettings(userId, { onboardingStep: currentStep });
      } catch (error) {
        logger.error('Failed to save onboarding step to Turso, using localStorage fallback', {
          error,
        });
        // Fallback to localStorage if Turso fails
        try {
          localStorage.setItem(ONBOARDING_STEP_KEY, currentStep);
        } catch (localError) {
          logger.error('Failed to save onboarding step to localStorage', { error: localError });
        }
      }
    };

    const timeoutId = setTimeout(() => {
      void saveStep();
    }, 300); // Debounce for 300ms

    return (): void => clearTimeout(timeoutId);
  }, [currentStep, userId, isLoading]);

  const startOnboarding = useCallback((): void => {
    setCurrentStep('welcome');
    setIsOpen(true);
    setIsCompleted(false);

    // Clear localStorage as backup
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const nextStep = useCallback((): void => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1] as OnboardingStep);
    } else if (currentIndex === STEPS.length - 1) {
      void completeOnboarding();
    }
  }, [currentStep, completeOnboarding]);

  const previousStep = useCallback((): void => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1] as OnboardingStep);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: OnboardingStep): void => {
    setCurrentStep(step);
  }, []);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    setIsCompleted(true);
    setCurrentStep('complete');
    setIsOpen(false);

    try {
      await updateUserSettings(userId, {
        onboardingComplete: true,
        onboardingStep: 'complete',
      });
    } catch (error) {
      logger.error('Failed to mark onboarding as complete in Turso, using localStorage fallback', {
        error,
      });
      // Fallback to localStorage if Turso fails
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        localStorage.setItem(ONBOARDING_STEP_KEY, 'complete');
      } catch (localError) {
        logger.error('Failed to save onboarding complete to localStorage', { error: localError });
      }
    }
  }, [userId, currentStep]);

  const skipOnboarding = useCallback(async (): Promise<void> => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const resetOnboarding = useCallback(async (): Promise<void> => {
    setIsCompleted(false);
    setCurrentStep('welcome');
    setIsOpen(true);

    try {
      await updateUserSettings(userId, {
        onboardingComplete: false,
        onboardingStep: 'welcome',
      });
    } catch (error) {
      logger.error('Failed to reset onboarding in Turso', { error });
    }
  }, [userId]);

  const closeModal = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const currentStepNumber =
    currentStep === 'complete' ? STEPS.length : STEPS.indexOf(currentStep) + 1;

  return {
    isCompleted,
    isOpen,
    currentStep,
    totalSteps: STEPS.length,
    currentStepNumber,
    startOnboarding,
    nextStep,
    previousStep,
    goToStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    closeModal,
  };
}
