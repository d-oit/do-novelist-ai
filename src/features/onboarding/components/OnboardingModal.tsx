import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect } from 'react';

import type { OnboardingStep } from '@/features/onboarding/hooks';
import { Button } from '@/shared/components/ui/Button';

import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingStepContent } from './OnboardingSteps';

interface OnboardingModalProps {
  isOpen: boolean;
  currentStep: OnboardingStep;
  currentStepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => Promise<void>;
}

/**
 * Modal component for the onboarding flow.
 * Displays step content with navigation controls.
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  currentStep,
  currentStepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep === 'complete') {
          void onComplete();
        } else {
          onNext();
        }
      } else if (e.key === 'ArrowLeft' && currentStepNumber > 1) {
        onPrevious();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, currentStepNumber, onNext, onPrevious, onSkip, onComplete]);

  const isComplete = currentStep === 'complete';
  const isFirstStep = currentStepNumber === 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm'
            onClick={onSkip}
            aria-hidden='true'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed inset-4 z-50 m-auto flex h-fit max-h-[90vh] max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2'
            role='dialog'
            aria-modal='true'
            aria-label='Onboarding'
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b px-6 py-4'>
              <span className='text-sm font-medium text-muted-foreground'>
                {isComplete ? 'Complete' : `Step ${currentStepNumber} of ${totalSteps}`}
              </span>
              <button
                onClick={onSkip}
                className='rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground'
                aria-label='Skip onboarding'
                type='button'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto px-6 py-8'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <OnboardingStepContent step={currentStep} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className='border-t px-6 py-4'>
              {!isComplete && (
                <div className='mb-4'>
                  <OnboardingProgress currentStep={currentStepNumber} totalSteps={totalSteps} />
                </div>
              )}

              <div className='flex items-center justify-between gap-3'>
                {isComplete ? (
                  <Button onClick={() => void onComplete()} className='w-full' size='lg'>
                    Get Started
                  </Button>
                ) : (
                  <>
                    <Button
                      variant='ghost'
                      onClick={onPrevious}
                      disabled={isFirstStep}
                      className='gap-1'
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Back
                    </Button>

                    <Button variant='ghost' onClick={onSkip} className='text-muted-foreground'>
                      Skip
                    </Button>

                    <Button onClick={onNext} className='gap-1'>
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
