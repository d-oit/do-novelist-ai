import React from 'react';

import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Progress indicator for onboarding steps.
 * Shows dots for each step with the current step highlighted.
 */
export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div
      className='flex items-center justify-center gap-2'
      role='progressbar'
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-300',
            i + 1 === currentStep
              ? 'w-6 bg-primary'
              : i + 1 < currentStep
                ? 'bg-primary/60'
                : 'bg-muted-foreground/30',
          )}
          aria-hidden='true'
        />
      ))}
    </div>
  );
};
