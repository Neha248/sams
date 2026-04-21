import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Calendar, ClipboardList, Bell, BarChart3, Users } from 'lucide-react';
import { Outlet, NavLink } from 'react-router-dom';

const AppLayout = () => {
  const { user, logout } = useAuthStore();

  const role = user?.role;
  const navItems =
    role === 'student'
      ? [
          { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
          { name: 'Attendance', icon: ClipboardList, path: '/attendance' },
          { name: 'Timetable', icon: Calendar, path: '/timetable' },
          { name: 'Notifications', icon: Bell, path: '/notifications' },
        ]
      : role === 'teacher'
        ? [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
            { name: 'Mark Attendance', icon: ClipboardList, path: '/teacher/attendance' },
            { name: 'Timetable', icon: Calendar, path: '/timetable' },
            { name: 'Analytics', icon: BarChart3, path: '/teacher/analytics' },
          ]
        : [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
            { name: 'Students', icon: Users, path: '/admin/students' },
            { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
          ];

  return (
    <div className="min-h-screen flex bg-navy-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-bold text-neon-blue tracking-wider glow-blue">SAMS <span className="text-sm font-normal text-slate-400 block">Neo-Shinjuku</span></h1>
        </div>
        
        <div className="p-4 flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 px-2">Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-neon-blue/10 text-neon-blue border-glow-blue'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                <item.icon size={18} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-navy-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-crimson p-[2px]">
              <div className="w-full h-full bg-navy-900 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">{user?.fullName.charAt(0)}</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm text-slate-200">{user?.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-neon-crimson hover:bg-neon-crimson/10 rounded border border-transparent hover:border-neon-crimson/20 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
        <div className="sticky top-0 z-20 border-b border-white/10 bg-navy-900/70 backdrop-blur">
          <div className="px-4 py-3 flex items-center justify-between md:justify-end">
            <div className="md:hidden">
              <div className="text-sm font-semibold text-slate-100">{user?.fullName}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-200 bg-white/5 border border-white/10 rounded hover:border-neon-crimson/30 hover:text-neon-crimson transition-all"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
        <div className="p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
