declare module '@uiw/react-md-editor' {
  import React from 'react';

  export interface MDEditorProps {
    value?: string;
    onChange?: (value?: string) => void;
    height?: number;
    visibleDragBar?: boolean;
    [key: string]: any;
  }

  const MDEditor: React.FC<MDEditorProps>;
  export default MDEditor;
}
