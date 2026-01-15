import { render, screen } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { describe, it, expect } from 'vitest';

import { MetricCard } from '@/shared/components/ui/MetricCard';

describe('MetricCard', () => {
  describe('basic rendering', () => {
    it('should render title and value', () => {
      render(<MetricCard title='Total Users' value={1234} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should render with string value', () => {
      render(<MetricCard title='Status' value='Active' />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render with numeric value', () => {
      render(<MetricCard title='Count' value={5000} />);

      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });

  describe('value formatting', () => {
    it('should format as number (default)', () => {
      render(<MetricCard title='Items' value={1234567} format='number' />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('should format as percentage', () => {
      render(<MetricCard title='Completion' value={0.75} format='percentage' />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should format as currency', () => {
      render(<MetricCard title='Revenue' value={1234.56} format='currency' />);

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should format as rating', () => {
      render(<MetricCard title='Rating' value={4.7} format='rating' />);

      expect(screen.getByText('4.7 ★')).toBeInTheDocument();
    });

    it('should handle prefix', () => {
      render(<MetricCard title='Amount' value={100} prefix='~' />);

      expect(screen.getByText('~100')).toBeInTheDocument();
    });

    it('should handle suffix', () => {
      render(<MetricCard title='Duration' value={45} suffix=' mins' />);

      expect(screen.getByText('45 mins')).toBeInTheDocument();
    });

    it('should handle both prefix and suffix', () => {
      render(<MetricCard title='Range' value={50} prefix='~' suffix='+' />);

      expect(screen.getByText('~50+')).toBeInTheDocument();
    });

    it('should handle prefix with string value', () => {
      render(<MetricCard title='Status' value='Good' prefix='Status: ' />);

      expect(screen.getByText('Status: Good')).toBeInTheDocument();
    });
  });

  describe('change indicators', () => {
    it('should display positive change', () => {
      render(<MetricCard title='Sales' value={100} change={12.5} />);

      expect(screen.getByText('12.5% from last period')).toBeInTheDocument();
    });

    it('should display negative change', () => {
      render(<MetricCard title='Sales' value={100} change={-5.3} />);

      expect(screen.getByText('5.3% from last period')).toBeInTheDocument();
    });

    it('should display zero change', () => {
      render(<MetricCard title='Sales' value={100} change={0} />);

      expect(screen.getByText('0.0% from last period')).toBeInTheDocument();
    });

    it('should use custom change label', () => {
      render(<MetricCard title='Revenue' value={1000} change={10} changeLabel='vs last month' />);

      expect(screen.getByText('10.0% vs last month')).toBeInTheDocument();
    });

    it('should not display change when undefined', () => {
      render(<MetricCard title='Sales' value={100} />);

      expect(screen.queryByText(/from last period/)).not.toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('should show up trend with green color', () => {
      const { container } = render(<MetricCard title='Sales' value={100} change={10} trend='up' />);
      const changeElement = container.querySelector('.text-green-600');

      expect(changeElement).toBeInTheDocument();
    });

    it('should show down trend with red color and rotated icon', () => {
      const { container } = render(<MetricCard title='Sales' value={100} change={-10} trend='down' />);
      const changeElement = container.querySelector('.text-red-600');
      const icon = container.querySelector('.rotate-180');

      expect(changeElement).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    it('should show neutral trend', () => {
      const { container } = render(<MetricCard title='Sales' value={100} change={0} trend='neutral' />);
      const changeElement = container.querySelector('.text-muted-foreground');

      expect(changeElement).toBeInTheDocument();
    });

    it('should auto-detect positive trend from change value', () => {
      const { container } = render(<MetricCard title='Sales' value={100} change={15} />);
      const changeElement = container.querySelector('.text-green-600');

      expect(changeElement).toBeInTheDocument();
    });

    it('should auto-detect negative trend from change value', () => {
      const { container } = render(<MetricCard title='Sales' value={100} change={-15} />);
      const changeElement = container.querySelector('.text-red-600');

      expect(changeElement).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render with default variant', () => {
      const { container } = render(<MetricCard title='Test' value={100} variant='default' />);
      const card = container.querySelector('.from-card');

      expect(card).toBeInTheDocument();
    });

    it('should render with success variant', () => {
      const { container } = render(<MetricCard title='Test' value={100} variant='success' />);
      const card = container.querySelector('.from-green-500\\/5');

      expect(card).toBeInTheDocument();
    });

    it('should render with warning variant', () => {
      const { container } = render(<MetricCard title='Test' value={100} variant='warning' />);
      const card = container.querySelector('.from-orange-500\\/5');

      expect(card).toBeInTheDocument();
    });

    it('should render with danger variant', () => {
      const { container } = render(<MetricCard title='Test' value={100} variant='danger' />);
      const card = container.querySelector('.from-red-500\\/5');

      expect(card).toBeInTheDocument();
    });
  });

  describe('icon display', () => {
    it('should render with icon', () => {
      render(<MetricCard title='Revenue' value={1000} icon={<DollarSign data-testid='icon' />} />);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      render(<MetricCard title='Revenue' value={1000} />);
      const iconContainer = document.querySelector('.rounded-xl.bg-secondary\\/50');

      expect(iconContainer).not.toBeInTheDocument();
    });

    it('should apply custom color to icon', () => {
      const { container } = render(
        <MetricCard title='Revenue' value={1000} icon={<DollarSign />} color='text-red-500' />,
      );
      const iconContainer = container.querySelector('.text-red-500');

      expect(iconContainer).toBeInTheDocument();
    });

    it('should use default color when not specified', () => {
      const { container } = render(<MetricCard title='Revenue' value={1000} icon={<DollarSign />} />);
      const iconContainer = container.querySelector('.text-blue-500');

      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<MetricCard title='Test' value={100} className='custom-metric' />);
      const wrapper = container.querySelector('.custom-metric');

      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('should wrap content in motion.div', () => {
      const { container } = render(<MetricCard title='Test' value={100} />);
      // motion.div will be rendered as a div element
      const motionDiv = container.firstChild;

      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      render(<MetricCard title='Big Number' value={9999999999} />);

      expect(screen.getByText('9,999,999,999')).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<MetricCard title='Zero' value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle negative numbers', () => {
      render(<MetricCard title='Negative' value={-500} />);

      expect(screen.getByText('-500')).toBeInTheDocument();
    });

    it('should handle decimal numbers in number format', () => {
      render(<MetricCard title='Decimal' value={123.45} format='number' />);

      expect(screen.getByText('123.45')).toBeInTheDocument();
    });

    it('should handle percentage edge cases', () => {
      render(<MetricCard title='Percentage' value={1.5} format='percentage' />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should handle rating with whole numbers', () => {
      render(<MetricCard title='Rating' value={5} format='rating' />);

      expect(screen.getByText('5.0 ★')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<MetricCard title='Empty' value='' />);

      expect(screen.getByText('Empty')).toBeInTheDocument();
    });
  });

  describe('complex scenarios', () => {
    it('should render complete metric card with all features', () => {
      render(
        <MetricCard
          title='Monthly Revenue'
          value={12345.67}
          format='currency'
          change={15.5}
          trend='up'
          icon={<DollarSign data-testid='dollar-icon' />}
          variant='success'
          changeLabel='vs last month'
          className='my-metric'
        />,
      );

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByText('$12,345.67')).toBeInTheDocument();
      expect(screen.getByText('15.5% vs last month')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
    });

    it('should handle metric card with prefix and currency format', () => {
      render(<MetricCard title='Estimated' value={1000} format='currency' prefix='~' />);

      expect(screen.getByText('~$1,000')).toBeInTheDocument();
    });

    it('should handle metric card with suffix and rating format', () => {
      render(<MetricCard title='Score' value={4.5} format='rating' suffix=' / 5' />);

      expect(screen.getByText('4.5 ★ / 5')).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    it('should memoize formatted value', () => {
      const { rerender } = render(<MetricCard title='Test' value={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();

      // Rerender with same props - memoization should prevent recalculation
      rerender(<MetricCard title='Test' value={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should recalculate when value changes', () => {
      const { rerender } = render(<MetricCard title='Test' value={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();

      rerender(<MetricCard title='Test' value={200} />);

      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });
});
