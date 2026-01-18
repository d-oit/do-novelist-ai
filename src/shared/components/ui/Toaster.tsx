import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';

import {
  announceToScreenReader,
  announceToScreenReaderAssertive,
} from '@/lib/hooks/useLiveAnnounce';
import { useToastStore, type Toast } from '@/lib/stores/toastStore';
import { cn } from '@/lib/utils';

export const Toaster = () => {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div className='fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-8 md:right-8'>
      <AnimatePresence mode='popLayout'>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const hasAnnounced = useRef(false);

  // Announce toast to screen readers
  useEffect(() => {
    if (!hasAnnounced.current) {
      hasAnnounced.current = true;
      const message = toast.title
        ? toast.description
          ? `${toast.title}: ${toast.description}`
          : toast.title
        : toast.description || '';

      if (message) {
        // Use assertive for errors, polite for everything else
        if (toast.variant === 'destructive') {
          announceToScreenReaderAssertive(message);
        } else {
          announceToScreenReader(message);
        }
      }
    }
  }, [toast]);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast, onDismiss]);

  const icons = {
    default: <Info className='h-5 w-5 text-blue-500' />,
    success: <CheckCircle className='h-5 w-5 text-green-500' />,
    destructive: <AlertCircle className='h-5 w-5 text-red-500' />,
  };

  const variants = {
    default: 'border-border bg-background',
    success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20',
    destructive: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20',
  };

  const variant = toast.variant || 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        variants[variant],
      )}
      role='status'
      aria-live='off'
    >
      <div className='flex-shrink-0'>{icons[variant]}</div>
      <div className='flex-1 pt-0.5'>
        {toast.title && <h3 className='text-sm font-semibold'>{toast.title}</h3>}
        {toast.description && <p className='text-sm text-muted-foreground'>{toast.description}</p>}
        {toast.action && <div className='mt-2'>{toast.action}</div>}
      </div>
      <button
        type='button'
        onClick={() => onDismiss(toast.id)}
        className='flex-shrink-0 rounded-md p-1 opacity-50 hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary dark:hover:bg-white/10'
      >
        <X className='h-4 w-4' />
      </button>
    </motion.div>
  );
};
