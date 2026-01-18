import { AlertTriangle } from 'lucide-react';
import type { FC } from 'react';

import { Button } from './Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * ConfirmDialog - Accessible confirmation dialog component
 * 
 * Replaces window.confirm() with a proper accessible dialog that:
 * - Is keyboard navigable
 * - Has proper ARIA attributes
 * - Doesn't block the UI thread
 * - Can be styled and customized
 * - Works well on mobile
 * 
 * @example
 * ```tsx
 * const [confirmOpen, setConfirmOpen] = useState(false);
 * 
 * <ConfirmDialog
 *   open={confirmOpen}
 *   onOpenChange={setConfirmOpen}
 *   title="Delete Goal"
 *   description="Are you sure you want to delete this goal? This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={() => {
 *     // Delete logic
 *     setConfirmOpen(false);
 *   }}
 * />
 * ```
 */
export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = (): void => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = (): void => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            {variant === 'destructive' && (
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
                <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className='pt-2'>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={handleCancel} autoFocus={variant !== 'destructive'}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            autoFocus={variant === 'destructive'}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
