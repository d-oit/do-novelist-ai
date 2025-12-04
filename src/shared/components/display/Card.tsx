import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

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
  },
);

/**
 * Props for the main Card component
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

/**
 * Props for CardHeader component
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional className for CardHeader
   */
  className?: string;
}

/**
 * Props for CardTitle component
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Additional className for CardTitle
   */
  className?: string;
}

/**
 * Props for CardDescription component
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Additional className for CardDescription
   */
  className?: string;
}

/**
 * Props for CardContent component
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional className for CardContent
   */
  className?: string;
}

/**
 * Props for CardFooter component
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional className for CardFooter
   */
  className?: string;
}

/**
 * Reusable Card component with multiple variants and interactive modes
 *
 * @example
 * ```tsx
 * <Card variant="elevated" interactive>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 *   <CardFooter>Card footer</CardFooter>
 * </Card>
 * ```
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, interactive, className }))} {...props} />
  ),
);

/**
 * Card header section with proper spacing
 */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));

/**
 * Card title with proper typography
 */
const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

/**
 * Card description with muted text styling
 */
const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);

/**
 * Card content section with proper padding
 */
const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

/**
 * Card footer section with flex layout for actions
 */
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));

// Set display names for React DevTools
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
