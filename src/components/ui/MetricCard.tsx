import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

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
  className
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

  const getVariantStyles = () => {
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

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    if (change !== undefined) {
      return change >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={cn(
        "p-6 relative overflow-hidden bg-gradient-to-br",
        getVariantStyles()
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold font-serif">{formatValue(value)}</p>

            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs",
                getTrendColor()
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  (trend === 'down' || (trend === undefined && change < 0)) && "rotate-180"
                )} />
                {Math.abs(change).toFixed(1)}% {changeLabel}
              </div>
            )}
          </div>

          {icon && (
            <div className={cn("p-3 rounded-xl bg-secondary/50", color)}>
              {icon}
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />
      </Card>
    </motion.div>
  );
};

export default MetricCard;
