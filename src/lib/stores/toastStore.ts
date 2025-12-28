import { create } from 'zustand';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>(set => ({
  toasts: [],
  addToast: toast => {
    const id = Math.random().toString(36).substring(2, 9);
    set(state => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  dismissToast: id =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));

export const toast = (props: Omit<Toast, 'id'>) => {
  return useToastStore.getState().addToast(props);
};
