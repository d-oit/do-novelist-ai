import { Suspense, lazy } from 'react';

const MDEditor = lazy(() => import('@uiw/react-md-editor'));

interface LazyMDEditorProps extends Record<string, any> {
  value?: string;
  onChange?: (value?: string) => void;
}

const LazyMDEditor = (props: LazyMDEditorProps) => (
  <Suspense
    fallback={
      <div className='flex items-center justify-center h-full'>
        <div className='text-muted-foreground'>Loading Editor...</div>
      </div>
    }
  >
    <MDEditor {...props} />
  </Suspense>
);

export default LazyMDEditor;
