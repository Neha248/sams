import { useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';

type AttendanceItem = {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  subjectId?: { name?: string; code?: string };
};

const todayLabel = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const Attendance = () => {
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchToday = async () => {
      setLoading(true);
      setError('');
      try {
        const res = (await api.get('/student/attendance?today=true&limit=50')) as {
          data: { records: AttendanceItem[] };
        };
        setRecords(res.data.records || []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  const counts = useMemo(() => {
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const lateAsAbsent = Math.floor(late / 2);
    return {
      total: records.length,
      present,
      absent,
      late,
      lateAsAbsent,
      effectiveAbsent: absent + lateAsAbsent,
    };
  }, [records]);

  const statusStyle = (status: string) => {
    if (status === 'present') return 'text-neon-blue bg-neon-blue/10 border-neon-blue/30';
    if (status === 'late') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    return 'text-neon-crimson bg-neon-crimson/10 border-neon-crimson/30';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Today&apos;s Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">{todayLabel}</p>
        <p className="text-xs text-slate-500 mt-1">Only classes marked for today are shown here.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat label="Total today" value={counts.total} />
        <MiniStat label="Present" value={counts.present} tone="blue" />
        <MiniStat label="Late" value={counts.late} tone="amber" />
        <MiniStat label="Absent" value={counts.absent} tone="crimson" />
        <MiniStat label="Eff. absent*" value={counts.effectiveAbsent} tone="crimson" hint="2 late = 1 absent" />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Marked classes — {todayLabel}
          </h2>
        </div>
        {loading ? (
          <div className="p-6 text-slate-400">Loading today&apos;s attendance...</div>
        ) : error ? (
          <div className="p-6 text-neon-crimson">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No attendance marked for today yet. Check back after your classes.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Time marked</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row._id} className="border-t border-white/5 text-slate-200">
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{row.subjectId?.name || '—'}</span>
                    {row.subjectId?.code ? (
                      <span className="text-slate-500 text-sm ml-2">({row.subjectId.code})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(row.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold uppercase px-2.5 py-1 rounded border ${statusStyle(row.status)}`}
                    >
                      {row.status}
                      {row.status === 'late' ? ' (counts toward absent if paired)' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{row.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const MiniStat = ({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string;
  value: number;
  tone?: 'blue' | 'amber' | 'crimson' | 'default';
  hint?: string;
}) => {
  const color =
    tone === 'blue'
      ? 'text-neon-blue'
      : tone === 'amber'
        ? 'text-amber-400'
        : tone === 'crimson'
          ? 'text-neon-crimson'
          : 'text-white';

  return (
    <div className="glass-panel rounded-lg p-3 border border-white/10">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {hint ? <p className="text-[9px] text-slate-500 mt-0.5">{hint}</p> : null}
    </div>
  );
};

export default Attendance;
