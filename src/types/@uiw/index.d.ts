import { FC } from 'react';

declare module '@uiw/react-md-editor' {
  import type * as React from 'react';

  interface MDEditorProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    onChange?: (value?: string) => void;
    height?: number | string;
    visibleDragbar?: boolean;
    preview?: 'live' | 'edit' | 'preview';
    hideToolbar?: boolean;
    visibleToolbar?: boolean;
    hidePreview?: boolean;
    [key: string]: unknown;
  }

  const MDEditor: React.FC<MDEditorProps>;
  export default MDEditor;
}
