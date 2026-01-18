import { BookOpen, Sparkles, LayoutDashboard, Rocket } from 'lucide-react';
import React from 'react';

import type { OnboardingStep } from '@/features/onboarding/hooks';

interface StepContentProps {
  step: OnboardingStep;
}

interface StepData {
  icon: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
}

const STEP_DATA: Record<Exclude<OnboardingStep, 'complete'>, StepData> = {
  welcome: {
    icon: <BookOpen className='h-12 w-12 text-primary' />,
    title: 'Welcome to Novelist.ai',
    description:
      'Your AI-powered writing companion for creating compelling novels. Let us show you around.',
    features: [
      'AI-assisted story generation',
      'World building tools',
      'Character development',
      'Plot visualization',
    ],
  },
  'create-project': {
    icon: <Rocket className='h-12 w-12 text-primary' />,
    title: 'Create Your First Project',
    description:
      'Start by creating a project. Give your story a title, choose a genre, and describe your idea.',
    features: [
      'Choose from multiple genres',
      'Set your target word count',
      'Add a brief story idea',
      'Customize writing style',
    ],
  },
  'explore-dashboard': {
    icon: <LayoutDashboard className='h-12 w-12 text-primary' />,
    title: 'Explore the Dashboard',
    description:
      'The dashboard is your command center. View chapters, track progress, and manage your story.',
    features: [
      'Chapter overview and navigation',
      'Project statistics',
      'Manual action controls',
      'AI agent console',
    ],
  },
  'ai-features': {
    icon: <Sparkles className='h-12 w-12 text-primary' />,
    title: 'AI-Powered Features',
    description:
      'Leverage AI to enhance your writing. Generate outlines, expand chapters, and refine content.',
    features: [
      'Auto-pilot mode for hands-free generation',
      'Generate chapter outlines',
      'Expand and refine content',
      'Character voice analysis',
    ],
  },
};

/**
 * Renders the content for each onboarding step.
 */
export const OnboardingStepContent: React.FC<StepContentProps> = ({ step }) => {
  if (step === 'complete') {
    return (
      <div className='flex flex-col items-center text-center'>
        <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
          <Sparkles className='h-10 w-10 text-primary' />
        </div>
        <h2 className='mb-3 text-2xl font-bold'>You&apos;re All Set!</h2>
        <p className='text-muted-foreground'>
          You&apos;re ready to start writing. Create your first project and let your imagination
          flow.
        </p>
      </div>
    );
  }

  const data = STEP_DATA[step];

  return (
    <div className='flex flex-col items-center text-center'>
      <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
        {data.icon}
      </div>
      <h2 className='mb-3 text-2xl font-bold'>{data.title}</h2>
      <p className='mb-6 max-w-md text-muted-foreground'>{data.description}</p>
      {data.features && (
        <ul className='space-y-2 text-left'>
          {data.features.map((feature, index) => (
            <li key={index} className='flex items-center gap-2 text-sm'>
              <div className='h-1.5 w-1.5 rounded-full bg-primary' />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
