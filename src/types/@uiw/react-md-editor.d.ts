declare module '@uiw/react-md-editor' {
  import type React from 'react';

  export interface MDEditorProps {
    value?: string;
    onChange?: (value?: string) => void;
    height?: number;
    visibleDragBar?: boolean;
    [key: string]: unknown;
  }

  const MDEditor: React.ComponentType<MDEditorProps>;
  export default MDEditor;
}
