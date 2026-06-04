import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SubjectWiseAttendanceRow } from '../components/attendance/types';
import api from '../lib/axios';

type Notice = {
  _id: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
};

const Notifications = () => {
  const [items, setItems] = useState<Notice[]>([]);
  const [unsafeSubjects, setUnsafeSubjects] = useState<SubjectWiseAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [noticesRes, dashboardRes] = await Promise.all([
          api.get('/student/notifications') as Promise<{ data: Notice[] }>,
          api.get('/student/dashboard') as Promise<{
            data: {
              subjectSafeSummary?: { unsafeSubjects?: SubjectWiseAttendanceRow[] };
            };
          }>,
        ]);
        setItems(noticesRes.data || []);
        setUnsafeSubjects(dashboardRes.data.subjectSafeSummary?.unsafeSubjects ?? []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">Admin announcements</p>
        </div>
        <button
          onClick={() => setShowAlerts(true)}
          className="px-4 py-2 rounded-lg border border-neon-blue/30 text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/20 transition-all text-sm font-semibold flex items-center gap-2"
        >
          <span>⚠️</span> View Alert Messages
        </button>
      </div>

      {loading ? (
        <div className="glass-panel border border-white/10 rounded-lg p-4 text-slate-400">
          Loading...
        </div>
      ) : error ? (
        <div className="glass-panel border border-neon-crimson/30 rounded-lg p-4 text-neon-crimson">
          {error}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Admin announcements
            </h2>
            {items.length === 0 ? (
              <div className="glass-panel border border-white/10 rounded-lg p-4 text-slate-400">
                No admin notifications available.
              </div>
            ) : (
              items.map((n) => (
                <div key={n._id} className="glass-panel border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between gap-4">
                    <h3 className="text-white font-semibold">{n.title}</h3>
                    <span className="text-xs text-slate-400 uppercase">{n.priority || 'info'}</span>
                  </div>
                  <p className="text-slate-300 mt-2">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-3">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Alert Messages Modal */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 space-y-4 bg-navy-950/95 shadow-2xl relative">
            <button
              onClick={() => setShowAlerts(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                Alert Messages
              </h3>
            </div>
            {unsafeSubjects.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-neon-crimson font-semibold">
                  The following subjects are below the safe attendance zone (75%):
                </p>
                <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {unsafeSubjects.map((s) => (
                    <li
                      key={s.subjectId || s.subjectCode}
                      className="rounded-lg border border-white/10 bg-navy-900/60 px-4 py-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">
                          {s.subjectName}{' '}
                          <span className="text-slate-400 font-normal">({s.subjectCode})</span>
                        </p>
                        <span className="text-neon-crimson font-bold text-sm">
                          {s.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Need <span className="text-white font-medium">+{s.classesNeeded}</span> present to reach 75%.
                      </p>
                      {s.suggestion && (
                        <p className="text-xs text-neon-blue">💡 {s.suggestion}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-neon-blue py-4">
                All subjects are in the safe zone. Well done!
              </p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowAlerts(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all text-xs font-semibold"
              >
                Close
              </button>
              <Link
                to="/attendance"
                className="px-4 py-2 rounded-lg bg-neon-blue text-navy-950 hover:bg-neon-blue/80 transition-all text-xs font-bold"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
