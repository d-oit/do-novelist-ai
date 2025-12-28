'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

const DialogProvider = DialogContext.Provider;

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange],
  );

  return (
    <DialogProvider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogProvider>
  );
};

interface DialogContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
> {
  children: React.ReactNode;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onOpenChange(false);
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [open, onOpenChange]);

    // Simple focus trap
    React.useEffect(() => {
      if (open && contentRef.current) {
        const focusableElements = contentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        if (firstElement) {
          firstElement.focus();
        }
      }
    }, [open]);

    if (typeof document === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {open && (
          <div className='fixed inset-0 z-50 flex items-center justify-center'>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 backdrop-blur-sm'
              onClick={() => onOpenChange(false)}
              aria-hidden='true'
            />

            {/* Dialog Content */}
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative z-50 grid w-full max-w-lg gap-4 rounded-xl border bg-card p-6 shadow-xl',
                className,
              )}
              role='dialog'
              aria-modal='true'
              {...props}
            >
              {children}
              <button
                type='button'
                className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
                onClick={() => onOpenChange(false)}
                aria-label='Close'
              >
                <X className='h-4 w-4' />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body,
    );
  },
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  ),
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  ),
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
