import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { MaterialIcon } from '../atoms/MaterialIcon';

type NavItemProps = {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
};

export function NavItem({ to, icon, label, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-unit py-3 px-6 transition-all duration-300',
          isActive
            ? 'text-secondary border-l-4 border-secondary bg-secondary-container/10 translate-x-1'
            : 'text-on-tertiary-container hover:text-on-tertiary hover:bg-tertiary-container/50'
        )
      }
    >
      <MaterialIcon name={icon} />
      <span className="text-body-md">{label}</span>
    </NavLink>
  );
}
