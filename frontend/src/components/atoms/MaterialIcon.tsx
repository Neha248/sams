import { cn } from '../../lib/utils';

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClass = {
  sm: 'text-sm',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-[80px]',
};

export function MaterialIcon({ name, className, filled, size = 'md' }: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined leading-none', sizeClass[size], className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
