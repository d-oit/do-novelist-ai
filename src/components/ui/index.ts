/**
 * UI Components - Re-export from canonical shared location
 *
 * All UI primitives are defined in @/shared/components/ui
 * This file maintains backward compatibility for existing imports from @/components/ui
 *
 * @deprecated Use @/shared/components/ui directly for new code
 */

export { Badge, badgeVariants, type BadgeProps } from '@/shared/components/ui/Badge';
export { Button, buttonVariants, type ButtonProps } from '@/shared/components/ui/Button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from '@/shared/components/ui/Card';
export { MetricCard, type MetricCardProps } from '@/shared/components/ui/MetricCard';
