import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
    'hover:scale-[0.98] active:scale-95 disabled:opacity-50',
    'ring-1 ring-black/5 dark:ring-white/5',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-r from-primary to-primary/90',
          'text-primary-foreground shadow-lg shadow-primary/20',
          'hover:shadow-xl hover:shadow-primary/30',
        ],
        destructive: [
          'bg-gradient-to-r from-destructive to-destructive/90',
          'text-destructive-foreground shadow-lg shadow-destructive/20',
          'hover:shadow-xl hover:shadow-destructive/30',
        ],
        outline: [
          'border border-input bg-background/50 backdrop-blur-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-gradient-to-r from-secondary to-secondary/90',
          'text-secondary-foreground shadow-md',
          'hover:from-secondary/90 hover:to-secondary/80 hover:shadow-lg',
        ],
        ghost: ['hover:bg-accent hover:text-accent-foreground', 'hover:shadow-sm'],
        link: ['text-primary underline-offset-4 hover:underline', 'shadow-none hover:shadow-none'],
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
