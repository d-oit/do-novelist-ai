import React, { Suspense } from 'react';

interface LazyRechartsProps {
  [key: string]: unknown;
}

const Loading = (): React.JSX.Element => {
  return (
    <div className='flex h-64 items-center justify-center'>
      <div className='text-muted-foreground'>Loading Charts...</div>
    </div>
  );
};

// Placeholder lazy-loaded component for recharts
const LazyRecharts = (_props: LazyRechartsProps): React.JSX.Element => {
  return (
    <Suspense fallback={<Loading />}>
      <div className='flex h-64 items-center justify-center'>
        <div className='text-muted-foreground'>Recharts components not loaded</div>
      </div>
    </Suspense>
  );
};

export default LazyRecharts;
