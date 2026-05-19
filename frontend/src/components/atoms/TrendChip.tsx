import { cn } from '../../lib/utils';
import { MaterialIcon } from './MaterialIcon';

type TrendChipVariant = 'up' | 'stable' | 'optimal' | 'down';

const variants: Record<TrendChipVariant, string> = {
  up: 'text-green-600 bg-green-50',
  stable: 'text-on-surface-variant bg-surface-container-low',
  optimal: 'text-secondary bg-secondary-fixed',
  down: 'text-error bg-error-container/30',
};

type TrendChipProps = {
  variant: TrendChipVariant;
  label: string;
  showTrendIcon?: boolean;
};

export function TrendChip({ variant, label, showTrendIcon }: TrendChipProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-bold',
        variants[variant]
      )}
    >
      {showTrendIcon && variant === 'up' && <MaterialIcon name="trending_up" size="sm" />}
      {label}
    </div>
  );
}
