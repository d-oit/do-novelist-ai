import { Suspense, lazy } from 'react';
import type { ComponentProps } from 'react';

const MDEditor = lazy(() => import('@uiw/react-md-editor'));

interface LazyMDEditorProps extends Omit<ComponentProps<typeof MDEditor>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value?: string) => void;
}

const LazyMDEditor = (props: LazyMDEditorProps): JSX.Element => {
  return (
    <Suspense
      fallback={
        <div className='flex h-full items-center justify-center'>
          <div className='text-muted-foreground'>Loading Editor...</div>
        </div>
      }
    >
      <MDEditor {...props} />
    </Suspense>
  );
};

export default LazyMDEditor;
