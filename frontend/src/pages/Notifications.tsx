import { useEffect, useState } from 'react';
import SubjectSafeZoneAlerts from '../components/attendance/SubjectSafeZoneAlerts';
import type { SubjectSafeSummary, SubjectWiseAttendanceRow } from '../components/attendance/types';
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
  const [isSafe, setIsSafe] = useState(true);
  const [summary, setSummary] = useState<{
    classesNeeded?: number;
    effectiveAbsent?: number;
    lateAsAbsent?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [noticesRes, dashboardRes] = await Promise.all([
          api.get('/student/notifications') as Promise<{ data: Notice[] }>,
          api.get('/student/dashboard') as Promise<{
            data: {
              isSafe?: boolean;
              summary?: { classesNeeded?: number; effectiveAbsent?: number; lateAsAbsent?: number };
              subjectSafeSummary?: SubjectSafeSummary;
            };
          }>,
        ]);
        setItems(noticesRes.data || []);
        setIsSafe(Boolean(dashboardRes.data.isSafe));
        setSummary(dashboardRes.data.summary ?? null);
        setUnsafeSubjects(dashboardRes.data.subjectSafeSummary?.unsafeSubjects ?? []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalMakeupClasses = unsafeSubjects.reduce((sum, s) => sum + (s.classesNeeded ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm">Attendance alerts and admin announcements</p>
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
          {!isSafe && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-4">
                <h2 className="text-amber-400 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>🔔</span> Attendance alert
                </h2>
                <p className="text-slate-200 text-sm mt-2">
                  You need to attend a total of{' '}
                  <span className="text-white font-bold">{totalMakeupClasses}</span> more present
                  class(es) across subjects below to bring each subject to the{' '}
                  <span className="text-neon-blue font-semibold">75% safe zone</span>.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Policy: 2 late marks = 1 absent · Effective absent (overall):{' '}
                  {summary?.effectiveAbsent ?? 0} (includes {summary?.lateAsAbsent ?? 0} from late)
                </p>
              </div>
              <SubjectSafeZoneAlerts unsafeSubjects={unsafeSubjects} />
            </div>
          )}

          {isSafe && (
            <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-5 py-4 text-neon-blue text-sm font-medium">
              All subjects are in the safe zone (≥75% each). No makeup classes required right now.
            </div>
          )}

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
    </div>
  );
};

export default Notifications;
