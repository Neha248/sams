import { cn } from '../../lib/utils';
import { MaterialIcon } from './MaterialIcon';

type GhostIconProps = {
  name: string;
  className?: string;
};

export function GhostIcon({ name, className }: GhostIconProps) {
  return <MaterialIcon name={name} className={cn('ghost-icon', className)} size="xl" />;
}
