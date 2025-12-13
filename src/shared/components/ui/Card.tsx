import { cva, type VariantProps } from 'class-variance-authority';
import React, { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Card component variants for different visual styles
 */
const cardVariants = cva(
  [
    'rounded-xl border bg-card text-card-foreground',
    'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
    'transition-all duration-300',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border/40 bg-card/80 backdrop-blur-sm',
          'hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)]',
        ],
        elevated: [
          'border-border/60 bg-card/90 backdrop-blur-md',
          'shadow-[0_16px_50px_rgb(0,0,0,0.08)] dark:shadow-[0_16px_50px_rgb(0,0,0,0.20)]',
          'hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_20px_60px_rgb(0,0,0,0.24)]',
        ],
        glass: [
          'border-border/30 bg-card/50 backdrop-blur-xl',
          'ring-1 ring-white/10 dark:ring-white/5',
        ],
        outline: ['border-border bg-transparent', 'hover:bg-card/50'],
      },
      interactive: {
        true: 'cursor-pointer hover:scale-[0.99] active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  }
);

/**
 * Props for the Card component
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

/**
 * Reusable Card component with multiple visual variants
 *
 * Features:
 * - Multiple visual styles (default, elevated, glass, outline)
 * - Interactive mode with hover effects
 * - Consistent shadows and border styling
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <Card variant="elevated" interactive>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 * </Card>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, interactive, className }))} {...props} />
  )
);

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };