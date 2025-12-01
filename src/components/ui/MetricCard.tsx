import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';

import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'percentage' | 'currency' | 'rating';
  changeLabel?: string;
  color?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
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
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return `${prefix}${val}${suffix}`;

    let formatted: string;
    switch (format) {
      case 'percentage':
        formatted = `${Math.round(val * 100)}%`;
        break;
      case 'currency':
        formatted = `$${val.toLocaleString()}`;
        break;
      case 'rating':
        formatted = `${val.toFixed(1)} ★`;
        break;
      default:
        formatted = val.toLocaleString();
    }

    return `${prefix}${formatted}${suffix}`;
  };

  const getVariantStyles = (): string => {
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
  };

  const getTrendColor = (): string => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    if (change !== undefined) {
      return change >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={className}>
      <Card className={cn('relative overflow-hidden bg-gradient-to-br p-6', getVariantStyles())}>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <p className='mb-1 text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='font-serif text-3xl font-bold'>{formatValue(value)}</p>

            {change !== undefined && (
              <div className={cn('mt-2 flex items-center gap-1 text-xs', getTrendColor())}>
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

          {icon !== undefined && (
            <div className={cn('rounded-xl bg-secondary/50 p-3', color)}>{icon}</div>
          )}
        </div>

        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent' />
      </Card>
    </motion.div>
  );
};

export default MetricCard;
