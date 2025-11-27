import React, { Suspense } from 'react';

const ProjectStats = React.lazy(() => import('./ProjectStats'));
const MonitoringDashboard = React.lazy(() => import('./MonitoringDashboard'));

const Loading = () => (
  <div className='flex items-center justify-center h-64'>
    <div className='text-muted-foreground'>Loading Charts...</div>
  </div>
);

export const LazyProjectStats = (props: any) => (
  <Suspense fallback={<Loading />}>
    <ProjectStats {...props} />
  </Suspense>
);

export const LazyMonitoringDashboard = (props: any) => (
  <Suspense fallback={<Loading />}>
    <MonitoringDashboard {...props} />
  </Suspense>
);