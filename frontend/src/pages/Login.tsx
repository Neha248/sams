import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const Login = () => {
  const [userId, setUserId] = useState('ADMIN001');
  const [password, setPassword] = useState('Admin@123');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { userId, password, role });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = res as any; // Due to axios interceptor returning response.data
      login(data.data.user, data.data.token);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-100 bg-navy-900 overflow-hidden">
      {/* Left side abstract visual */}
      <div className="hidden lg:flex flex-1 relative bg-navy-800 border-r border-white/5 items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#00D4FF_0%,_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-crimson to-transparent opacity-50 blur-[2px]" />
        
        <div className="relative z-10 max-w-lg z-10 glass-panel p-12 rounded-2xl border-t border-l border-white/10 shadow-2xl">
          <h1 className="text-5xl font-bold mb-6 glow-blue text-white">SAMS</h1>
          <p className="text-xl text-slate-300 font-light leading-relaxed">
            Smart Attendance Management System
          </p>
          <p className="mt-8 text-slate-500 text-sm">Design language: <span className="text-neon-blue">Neo-Shinjuku Night</span></p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 object-contain">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-400">Initialize session sequence</p>
          </div>

          <div className="flex bg-navy-800/50 p-1 rounded-lg mb-8 border border-white/5">
            {['student', 'teacher', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                className={`flex-1 py-2 text-sm capitalize rounded-md transition-all ${
                  role === r 
                    ? 'bg-neon-blue/20 text-neon-blue shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded bg-neon-crimson/10 border border-neon-crimson/30 text-neon-crimson text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-500">User ID</label>
              <input 
                type="text" 
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-500">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-4 bg-neon-blue text-navy-900 font-bold rounded-lg hover:bg-[#00e5ff] shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:shadow-[0_0_25px_rgba(0,212,255,0.6)] transition-all disabled:opacity-50 flex justify-center"
            >
              {loading ? 'Authenticating...' : 'Access Terminal'}
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-6">
              Use ADMIN001 / Admin@123 for Admin demo
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
