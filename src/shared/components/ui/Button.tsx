import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Button component variants for different visual styles and sizes
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium',
    'btn-press-effect',
    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
    'active:scale-97 hover:scale-[0.98] disabled:opacity-50',
    'ring-1 ring-black/5 dark:ring-white/5',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary',
          'text-primary-foreground',
          'hover:bg-primary-hover',
          'active:bg-primary-active active:shadow-inner',
          'focus-visible:ring-primary/20',
        ],
        destructive: [
          'bg-destructive',
          'text-destructive-foreground',
          'hover:bg-destructive-hover',
          'active:bg-destructive-active active:shadow-inner',
          'focus-visible:ring-destructive/20',
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent-hover hover:text-accent-foreground',
          'active:bg-accent-active active:text-accent-foreground active:shadow-inner',
          'focus-visible:ring-accent/20',
        ],
        secondary: [
          'bg-secondary',
          'text-secondary-foreground',
          'hover:bg-secondary-hover',
          'active:bg-secondary-active active:shadow-inner',
          'focus-visible:ring-secondary/20',
        ],
        ghost: [
          'hover:bg-accent-hover hover:text-accent-foreground',
          'active:bg-accent-active active:text-accent-foreground active:shadow-inner',
          'focus-visible:ring-accent/20',
        ],
        link: [
          'text-primary underline-offset-4 hover:underline',
          'active:text-primary/80',
          'focus-visible:ring-primary/20',
        ],
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
  },
);

/**
 * Props for the Button component
 */
export interface ButtonProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Reusable Button component with motion animations and consistent styling
 *
 * Features:
 * - Multiple visual variants (default, destructive, outline, secondary, ghost, link)
 * - Size options (sm, default, lg, icon)
 * - Framer Motion hover/tap animations
 * - Enhanced active states with WCAG 2.2 compliance
 * - Accessibility features (focus rings, disabled states)
 *
 * @example
 * ```tsx
 * <Button variant="default" size="lg">Primary Action</Button>
 * <Button variant="outline" size="sm">Secondary</Button>
 * <Button variant="destructive">Delete</Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, type: 'tween' }}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
