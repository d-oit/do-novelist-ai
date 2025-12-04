import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Badge component variants for different visual styles
 */
const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: ['border-transparent bg-primary text-primary-foreground hover:bg-primary/80'],
        secondary: [
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ],
        destructive: [
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        ],
        outline: 'text-foreground',
        success: ['border-transparent bg-green-500 text-white hover:bg-green-500/80'],
        warning: ['border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80'],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Props for the Badge component
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * Reusable Badge component for labels, tags, and status indicators
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="destructive">Error</Badge>
 * <Badge variant="outline">Draft</Badge>
 * ```
 */
const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
