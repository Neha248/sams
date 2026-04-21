import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get(`/${user?.role}/dashboard`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStats((res as any).data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchDashboard();
  }, [user]);

  if (!stats) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-navy-800 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-navy-800 rounded"></div><div className="h-4 bg-navy-800 rounded w-5/6"></div></div></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
        <p className="text-slate-400">Welcome back, {user?.fullName}. Here's what's happening today.</p>
      </header>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents} color="blue" />
          <StatCard title="Total Teachers" value={stats.totalTeachers} color="blue" />
          <StatCard title="Total Departments" value={stats.totalDepartments} color="blue" />
          <StatCard title="Classes Conducted Today" value={stats.totalClassesConducted} color="crimson" />
        </div>
      )}

      {user?.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Classes" value={stats.summary.total} color="blue" />
          <StatCard title="Present" value={stats.summary.present} color="blue" />
          <StatCard title="Absent" value={stats.summary.absent} color="crimson" />
          <StatCard 
            title="Attendance %" 
            value={`${stats.summary.percentage}%`} 
            color={stats.summary.percentage >= 75 ? "blue" : "crimson"} 
          />
        </div>
      )}

      {user?.role === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Assigned Classes" value={stats.stats.totalAssigned} color="blue" />
          <StatCard title="Classes Taken" value={stats.stats.classesTaken} color="blue" />
          <StatCard title="Completion %" value={`${stats.stats.weeklyCompletion}%`} color="blue" />
        </div>
      )}

      <div className="mt-8 glass-panel rounded-xl p-6 h-96 flex items-center justify-center">
         <p className="text-slate-500">More charts and analytics will be rendered here...</p>
      </div>
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
