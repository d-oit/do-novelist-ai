import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/Card';

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /** The title/label for the metric */
  title: string;
  /** The value to display */
  value: string | number;
  /** Optional change percentage from previous period */
  change?: number;
  /** Visual trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional icon to display with the metric */
  icon?: React.ReactNode;
  /** Visual variant for the card */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Text to prepend to the value */
  prefix?: string;
  /** Text to append to the value */
  suffix?: string;
  /** How to format the value */
  format?: 'number' | 'percentage' | 'currency' | 'rating';
  /** Label for the change indicator */
  changeLabel?: string;
  /** Color for the icon */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable metric display card with trend indicators and formatting
 *
 * Features:
 * - Automatic value formatting (number, percentage, currency, rating)
 * - Trend indicators with directional arrows
 * - Multiple visual variants
 * - Smooth motion animations
 * - Icon support with customizable styling
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Revenue"
 *   value={1234.56}
 *   change={12.5}
 *   format="currency"
 *   trend="up"
 *   icon={<DollarSign className="h-4 w-4" />}
 * />
 * ```
 */
export const MetricCard = ({
  title,
  value,
  change,
  trend,
  icon,
  variant = 'default',
  prefix = '',
  suffix = '',
  format = 'number',
  changeLabel = 'from last period',
  color = 'text-blue-500',
  className,
}: MetricCardProps) => {
  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return `${prefix}${value}${suffix}`;

    let formatted: string;
    switch (format) {
      case 'percentage':
        formatted = `${Math.round(value * 100)}%`;
        break;
      case 'currency':
        formatted = `$${value.toLocaleString()}`;
        break;
      case 'rating':
        formatted = `${value.toFixed(1)} ★`;
        break;
      default:
        formatted = value.toLocaleString();
    }

    return `${prefix}${formatted}${suffix}`;
  }, [value, prefix, suffix, format]);

  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'success':
        return 'from-green-500/5 via-card/90 to-green-500/10 border-green-500/20';
      case 'warning':
        return 'from-orange-500/5 via-card/90 to-orange-500/10 border-orange-500/20';
      case 'danger':
        return 'from-red-500/5 via-card/90 to-red-500/10 border-red-500/20';
      default:
        return 'from-card via-card/90 to-secondary/20';
    }
  }, [variant]);

  const trendColor = useMemo(() => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    if (change !== undefined) {
      return change >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-muted-foreground';
  }, [trend, change]);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={className}>
      <Card className={cn('relative overflow-hidden bg-gradient-to-br p-6', variantStyles)}>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <p className='mb-1 text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='font-serif text-3xl font-bold'>{formattedValue}</p>

            {change !== undefined && (
              <div className={cn('mt-2 flex items-center gap-1 text-xs', trendColor)}>
                <TrendingUp
                  className={cn(
                    'h-3 w-3',
                    (trend === 'down' || (trend === undefined && change < 0)) && 'rotate-180',
                  )}
                />
                {Math.abs(change).toFixed(1)}% {changeLabel}
              </div>
            )}
          </div>

          {icon && <div className={cn('rounded-xl bg-secondary/50 p-3', color)}>{icon}</div>}
        </div>

        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent' />
      </Card>
    </motion.div>
  );
};