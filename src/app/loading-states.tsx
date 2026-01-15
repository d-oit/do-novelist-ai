import { Skeleton } from '@/shared/components/ui/Skeleton';

export const ProjectsLoader = () => (
  <div className='flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-background p-8'>
    <div className='mb-8 text-center'>
      <Skeleton className='mx-auto h-12 w-64' />
      <Skeleton className='mx-auto mt-3 h-6 w-96' />
    </div>
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className='h-48 w-full' />
      ))}
    </div>
  </div>
);

export const SettingsLoader = () => (
  <div className='container mx-auto max-w-4xl space-y-8 p-8'>
    <Skeleton className='h-10 w-48' />
    <div className='space-y-4'>
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
  </div>
);

export const MetricsLoader = () => (
  <div className='container mx-auto space-y-6 p-6'>
    <div>
      <Skeleton className='h-10 w-48' />
      <Skeleton className='mt-2 h-6 w-96' />
    </div>
    <div className='space-y-4'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);

export const ConsoleLoader = () => (
  <div className='h-[300px] w-full rounded-lg border border-border bg-muted/20 p-4'>
    <div className='space-y-2'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <Skeleton className='h-4 w-2/3' />
      <Skeleton className='h-4 w-1/3' />
    </div>
  </div>
);

export const PlotEngineLoader = () => (
  <div className='container mx-auto space-y-6 p-6'>
    <div>
      <Skeleton className='h-10 w-48' />
      <Skeleton className='mt-2 h-6 w-96' />
    </div>
    <div className='flex gap-2'>
      <Skeleton className='h-10 w-32' />
      <Skeleton className='h-10 w-32' />
      <Skeleton className='h-10 w-32' />
    </div>
    <div className='space-y-4'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);

export const WorldBuildingLoader = () => (
  <div className='container mx-auto space-y-6 p-6'>
    <div>
      <Skeleton className='h-10 w-64' />
      <Skeleton className='mt-2 h-6 w-96' />
    </div>
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);

export const DialogueLoader = () => (
  <div className='container mx-auto space-y-6 p-6'>
    <div>
      <Skeleton className='h-10 w-64' />
      <Skeleton className='mt-2 h-6 w-96' />
    </div>
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
      <Skeleton className='h-64 w-full lg:col-span-2' />
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);
