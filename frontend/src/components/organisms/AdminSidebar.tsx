import { useAuthStore } from '../../store/authStore';
import { MaterialIcon } from '../atoms/MaterialIcon';
import { NavItem } from '../molecules/NavItem';

const ADMIN_NAV = [
  { to: '/', icon: 'domain', label: 'Departments', end: true },
  { to: '/admin/students', icon: 'group', label: 'Students' },
  { to: '/admin/teachers', icon: 'school', label: 'Teachers' },
  { to: '/admin/timetable', icon: 'calendar_month', label: 'Timetable' },
  { to: '/admin/notifications', icon: 'assessment', label: 'Reports' },
  { to: '/admin/notifications', icon: 'settings', label: 'Settings' },
];

export function AdminSidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-tertiary flex flex-col py-container-margin border-r border-outline-variant/20 shadow-lg z-50">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center">
          <MaterialIcon name="domain" className="text-on-secondary" />
        </div>
        <div>
          <h1 className="font-outfit text-headline-md font-bold text-on-tertiary">SAMS Admin</h1>
          <p className="text-label-md text-on-tertiary-container">Higher Ed Portal</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col">
        {ADMIN_NAV.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>

      <div className="px-6 mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-secondary/30 bg-secondary-container/30 flex items-center justify-center shrink-0">
          <span className="font-bold text-on-tertiary text-sm">
            {user?.fullName?.charAt(0) ?? 'A'}
          </span>
        </div>
        <div className="overflow-hidden min-w-0">
          <p className="text-label-md font-bold text-on-tertiary truncate">{user?.fullName}</p>
          <p className="text-label-md text-on-tertiary-container truncate capitalize">
            {user?.role ?? 'admin'}
          </p>
        </div>
      </div>
    </aside>
  );
}
