import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ProductivityChartProps {
  wordCountData: ChartDataPoint[];
  productivityData: ChartDataPoint[];
  className?: string;
}

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title,
  color = '#3B82F6',
  height = 200
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((maxValue - point.value) / range) * 80 + 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,90 ${points} 100,90`;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[20, 40, 60, 80].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill={`url(#gradient-${title})`}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = ((maxValue - point.value) / range) * 80 + 10;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="hover:r-3 transition-all"
              />
            );
          })}
        </svg>

        {/* Value labels */}
        <div className="absolute top-0 left-0 text-xs text-muted-foreground">
          {maxValue.toLocaleString()}
        </div>
        <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
          {minValue.toLocaleString()}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.label || data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.label || data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.label || data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export const ProductivityChart: React.FC<ProductivityChartProps> = ({
  wordCountData,
  productivityData,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}
    >
      <Card className="p-6">
        <SimpleLineChart
          data={wordCountData}
          title="Daily Word Count (Last 30 Days)"
          color="#3B82F6"
          height={200}
        />
      </Card>

      <Card className="p-6">
        <SimpleLineChart
          data={productivityData}
          title="Productivity Trend (Words/Hour)"
          color="#10B981"
          height={200}
        />
      </Card>
    </motion.div>
  );
};

export default ProductivityChart;
