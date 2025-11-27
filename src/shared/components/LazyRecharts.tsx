import React, { Suspense } from 'react';

const Loading = () => (
  <div className='flex items-center justify-center h-64'>
    <div className='text-muted-foreground'>Loading Charts...</div>
  </div>
);

// Placeholder lazy-loaded component for recharts
const LazyRecharts = (props: any) => (
  <Suspense fallback={<Loading />}>
    <div className='flex items-center justify-center h-64'>
      <div className='text-muted-foreground'>Recharts components not loaded</div>
    </div>
  </Suspense>
);

export default LazyRecharts;
