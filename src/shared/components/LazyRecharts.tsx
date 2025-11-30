import { Suspense } from 'react';

const Loading = () => (
  <div className='flex h-64 items-center justify-center'>
    <div className='text-muted-foreground'>Loading Charts...</div>
  </div>
);

// Placeholder lazy-loaded component for recharts
const LazyRecharts = (_props: any) => (
  <Suspense fallback={<Loading />}>
    <div className='flex h-64 items-center justify-center'>
      <div className='text-muted-foreground'>Recharts components not loaded</div>
    </div>
  </Suspense>
);

export default LazyRecharts;
