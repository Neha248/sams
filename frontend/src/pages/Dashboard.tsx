import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeIST, setTimeIST] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user?.role === 'teacher') {
          const [statsRes, classesRes] = await Promise.all([
            api.get('/teacher/dashboard/overview'),
            api.get('/teacher/dashboard/classes')
          ]);
          setStats((statsRes as any).data);
          setClasses((classesRes as any).data);
        } else {
          const res = await api.get(`/${user?.role}/dashboard`);
          setStats((res as any).data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to fetch dashboard data. Terminal offline.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (!stats || user?.role !== 'teacher' || !stats.time || !stats.date) return;

    setDateStr(stats.date);

    // Parse "HH:mm:ss IST"
    const timePart = stats.time.split(' ')[0]; // "HH:mm:ss"
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    // Create a date object matching today, set to this parsed time
    const clockDate = new Date();
    clockDate.setHours(hours, minutes, seconds);

    const updateClock = () => {
      clockDate.setSeconds(clockDate.getSeconds() + 1);
      
      const hh = String(clockDate.getHours()).padStart(2, '0');
      const mm = String(clockDate.getMinutes()).padStart(2, '0');
      const ss = String(clockDate.getSeconds()).padStart(2, '0');
      
      setTimeIST(`${hh}:${mm}:${ss} IST`);
    };

    // Set initial time immediately
    setTimeIST(stats.time);

    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [stats, user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse p-4">
        {/* Header skeleton */}
        <div className="h-10 bg-navy-800 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-navy-800 rounded w-1/2 mb-8"></div>

        {/* Top Section skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-28 bg-navy-800/50 rounded-xl border border-white/5"></div>
          <div className="h-28 bg-navy-800/50 rounded-xl border border-white/5"></div>
        </div>

        {/* Second Row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-navy-800/50 rounded-xl border border-white/5"></div>
          <div className="h-44 bg-navy-800/50 rounded-xl border border-white/5"></div>
          <div className="h-44 bg-navy-800/50 rounded-xl border border-white/5"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center space-y-4">
        <div className="text-neon-crimson text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-white">System Error</h2>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  const isTeacherEmpty = user?.role === 'teacher' && stats && stats.totalAssignedClasses === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {user?.role !== 'teacher' && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
          <p className="text-slate-400">Welcome back, {user?.fullName}. Here's what's happening today.</p>
        </header>
      )}

      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents} color="blue" />
          <StatCard title="Total Teachers" value={stats.totalTeachers} color="blue" />
          <StatCard title="Total Departments" value={stats.totalDepartments} color="blue" />
          <StatCard title="Classes Conducted Today" value={stats.totalClassesConducted} color="crimson" />
        </div>
      )}

      {user?.role === 'student' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Classes" value={stats.summary?.total || 0} color="blue" />
          <StatCard title="Present" value={stats.summary?.present || 0} color="blue" />
          <StatCard title="Absent" value={stats.summary?.absent || 0} color="crimson" />
          <StatCard 
            title="Attendance %" 
            value={`${stats.summary?.percentage || 0}%`} 
            color={(stats.summary?.percentage || 0) >= 75 ? "blue" : "crimson"} 
          />
        </div>
      )}

      {user?.role === 'teacher' && stats && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <header className="relative pb-6 border-b border-white/5 mb-8">
            <div className="absolute top-0 right-0 flex items-center gap-2 bg-neon-blue/10 border border-neon-blue/20 rounded-full px-3 py-1 text-xs text-neon-blue">
              <span className="w-2 h-2 bg-neon-blue rounded-full animate-ping" />
              Secure Link Active
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-wider glow-blue mb-2">
              Teacher Terminal Overview
            </h1>
            <p className="text-slate-400 text-sm">
              Access Terminal Secured — Live Performance Registry for {user?.fullName}
            </p>
          </header>

          {/* Top Section - Real-time Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-xl border-l-[3px] border-neon-blue bg-navy-900/40 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-all duration-500" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registry Date</h3>
              <div className="text-2xl font-bold text-slate-100 tracking-wide">
                {dateStr || 'Loading...'}
              </div>
              <p className="text-xs text-slate-500 mt-2">Local server calendar synced</p>
            </div>

            <div className="glass-panel p-6 rounded-xl border-l-[3px] border-neon-blue bg-navy-900/40 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-all duration-500" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Live Terminal Time</h3>
              <div className="text-2xl font-mono font-bold text-neon-blue tracking-wider">
                {timeIST || 'Loading...'}
              </div>
              <p className="text-xs text-slate-500 mt-2">Active Indian Standard Time (IST)</p>
            </div>
          </div>

          {/* Second Row - Class Statistics Metrics */}
          {isTeacherEmpty ? (
            <div className="glass-panel p-12 rounded-xl text-center space-y-4 max-w-2xl mx-auto border-t-2 border-neon-blue bg-navy-900/30">
              <div className="w-16 h-16 bg-neon-blue/10 border border-neon-blue/20 rounded-full flex items-center justify-center mx-auto text-neon-blue animate-pulse">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Terminal Standby Mode</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                No classes assigned for this terminal cycle. Sync your schedule with the central administration registry to receive assignments.
              </p>
              <div className="text-xs text-slate-500 uppercase tracking-widest pt-2">
                Status Code: SECURE_STANDBY
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-8 rounded-xl border-l-[4px] border-neon-blue bg-navy-900/40 backdrop-blur-md relative overflow-hidden group hover:border-neon-blue/60 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl group-hover:bg-neon-blue/10 transition-all duration-500" />
                <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wide">Total Assigned Classes</h3>
                <div className="text-5xl font-extrabold text-neon-blue tracking-tight">
                  {stats.totalAssignedClasses}
                </div>
                <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                  Active registry profile count
                </div>
              </div>

              <div className="glass-panel p-8 rounded-xl border-l-[4px] border-neon-blue bg-navy-900/40 backdrop-blur-md relative overflow-hidden group hover:border-neon-blue/60 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl group-hover:bg-neon-blue/10 transition-all duration-500" />
                <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wide">Total Classes To Take</h3>
                <div className="text-5xl font-extrabold text-neon-blue tracking-tight">
                  {stats.totalClassesToTake}
                </div>
                <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                  Remaining scheduled workload
                </div>
              </div>

              <div className="glass-panel p-8 rounded-xl border-l-[4px] border-neon-blue bg-navy-900/40 backdrop-blur-md relative overflow-hidden group hover:border-neon-blue/60 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl group-hover:bg-neon-blue/10 transition-all duration-500" />
                <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wide">Total Classes Completed</h3>
                <div className="text-5xl font-extrabold text-neon-blue tracking-tight">
                  {stats.totalClassesCompleted}
                </div>
                <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                  Successful log transmissions
                </div>
              </div>
            </div>
          )}

          {/* Teacher Daily Schedule Section */}
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                Teacher Daily Schedule
              </h2>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-widest bg-white/5 border border-white/10 rounded px-2.5 py-0.5">
                Live Registry Cycle
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-white/5 bg-navy-950/20 backdrop-blur-md">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-navy-900/90 backdrop-blur-md border-b border-white/10 z-10">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">SLNO</th>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</th>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dept</th>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Section</th>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Timing</th>
                      <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {classes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-sm">
                          NO ACTIVE CLASSES IN TODAY'S REGISTRY CYCLE
                        </td>
                      </tr>
                    ) : (
                      classes.map((row, index) => {
                        const isComplete = row.status?.toLowerCase() === 'complete';
                        return (
                          <tr 
                            key={row.id || index} 
                            className="hover:bg-white/5 transition-all duration-150 group"
                          >
                            <td className="p-4 text-sm font-mono text-slate-400">#{String(index + 1).padStart(2, '0')}</td>
                            <td className="p-4 text-sm font-bold text-white tracking-wide group-hover:text-neon-blue transition-colors">
                              {row.subject}
                            </td>
                            <td className="p-4 text-sm text-slate-300">{row.dept}</td>
                            <td className="p-4 text-sm font-mono text-slate-400">{row.section}</td>
                            <td className="p-4 text-sm font-mono text-neon-blue/80">{row.classTiming}</td>
                            <td className="p-4 text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-sm ${
                                isComplete 
                                  ? 'text-[#00D4FF] border-[#00D4FF]/30 bg-[#00D4FF]/10 shadow-[0_0_12px_rgba(0,212,255,0.15)]' 
                                  : 'text-[#FF7B00] border-[#FF7B00]/30 bg-[#FF7B00]/10 shadow-[0_0_12px_rgba(255,123,0,0.15)]'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
                                  isComplete ? 'bg-[#00D4FF]' : 'bg-[#FF7B00]'
                                }`} />
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card Stack View */}
            <div className="block md:hidden space-y-4">
              {classes.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-500 font-mono text-xs border border-white/5 rounded-xl bg-navy-900/30">
                  NO ACTIVE CLASSES IN TODAY'S REGISTRY CYCLE
                </div>
              ) : (
                classes.map((row, index) => {
                  const isComplete = row.status?.toLowerCase() === 'complete';
                  return (
                    <div 
                      key={row.id || index} 
                      className="glass-panel p-5 rounded-xl border border-white/5 bg-navy-900/30 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-300" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-mono text-slate-500">#{String(index + 1).padStart(2, '0')}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isComplete 
                            ? 'text-[#00D4FF] border-[#00D4FF]/30 bg-[#00D4FF]/10 shadow-[0_0_8px_rgba(0,212,255,0.1)]' 
                            : 'text-[#FF7B00] border-[#FF7B00]/30 bg-[#FF7B00]/10 shadow-[0_0_8px_rgba(255,123,0,0.1)]'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-white mb-3 group-hover:text-neon-blue transition-colors">
                        {row.subject}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px] mb-0.5">Department</span>
                          <span className="text-slate-300">{row.dept}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px] mb-0.5">Section</span>
                          <span className="text-slate-300 font-mono">{row.section}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-white/5 mt-1">
                          <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px] mb-0.5">Class Timing</span>
                          <span className="text-neon-blue/80 font-mono">{row.classTiming}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Tokyo Sector deployment note */}
          <div className="glass-panel p-6 rounded-xl bg-navy-950/40 border border-white/5 relative overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Tokyo Sector 04 Deployment</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Monitoring educational performance across Shinjuku high-intensity learning sectors. All biometric attendance logs are synchronized with the central terminal core.
            </p>
          </div>
        </div>
      )}

      {user?.role !== 'teacher' && (
        <div className="mt-8 glass-panel rounded-xl p-6 h-96 flex items-center justify-center">
           <p className="text-slate-500">More charts and analytics will be rendered here...</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string, value: string | number, color: 'blue' | 'crimson' }) => (
  <div className="glass-panel p-6 rounded-xl border-l-[3px]" style={{ borderLeftColor: color === 'blue' ? '#00D4FF' : '#FF4B6E' }}>
    <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
    <div className={`text-4xl font-bold ${color === 'blue' ? 'text-neon-blue' : 'text-neon-crimson'}`}>
      {value}
    </div>
  </div>
);

export default Dashboard;
