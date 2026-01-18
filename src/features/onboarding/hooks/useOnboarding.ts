import { useCallback, useEffect, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'novelist-onboarding-completed';
const ONBOARDING_STEP_KEY = 'novelist-onboarding-step';

export type OnboardingStep =
  | 'welcome'
  | 'create-project'
  | 'explore-dashboard'
  | 'ai-features'
  | 'complete';

interface UseOnboardingReturn {
  /** Whether onboarding has been completed */
  isCompleted: boolean;
  /** Whether onboarding modal should be shown */
  isOpen: boolean;
  /** Current step in the onboarding flow */
  currentStep: OnboardingStep;
  /** Total number of steps (excluding complete) */
  totalSteps: number;
  /** Current step number (1-indexed) */
  currentStepNumber: number;
  /** Start the onboarding flow */
  startOnboarding: () => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  previousStep: () => void;
  /** Skip to a specific step */
  goToStep: (step: OnboardingStep) => void;
  /** Complete and close onboarding */
  completeOnboarding: () => void;
  /** Skip onboarding without completing */
  skipOnboarding: () => void;
  /** Reset onboarding to show again */
  resetOnboarding: () => void;
  /** Close the modal temporarily */
  closeModal: () => void;
}

const STEPS: OnboardingStep[] = ['welcome', 'create-project', 'explore-dashboard', 'ai-features'];

/**
 * Hook for managing the onboarding flow.
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
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
      if (saved && STEPS.includes(saved as OnboardingStep)) {
        return saved as OnboardingStep;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'welcome';
  });

  const [isOpen, setIsOpen] = useState<boolean>(!isCompleted);

  // Persist step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep);
    } catch {
      // Ignore localStorage errors
    }
  }, [currentStep]);

  const startOnboarding = useCallback((): void => {
    setCurrentStep('welcome');
    setIsOpen(true);
    setIsCompleted(false);
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
      // Last step, move to complete
      setCurrentStep('complete');
    }
  }, [currentStep]);

  const previousStep = useCallback((): void => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1] as OnboardingStep);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: OnboardingStep): void => {
    setCurrentStep(step);
  }, []);

  const completeOnboarding = useCallback((): void => {
    setIsCompleted(true);
    setIsOpen(false);
    setCurrentStep('welcome');
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const skipOnboarding = useCallback((): void => {
    completeOnboarding();
  }, [completeOnboarding]);

  const resetOnboarding = useCallback((): void => {
    setIsCompleted(false);
    setCurrentStep('welcome');
    setIsOpen(true);
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

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
