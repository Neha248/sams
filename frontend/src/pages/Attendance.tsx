import { useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';

type AttendanceItem = {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  subjectId?: { name?: string; code?: string };
};

const Attendance = () => {
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const res = (await api.get(`/student/attendance${query}`)) as {
          data: { records: AttendanceItem[] };
        };
        setRecords(res.data.records || []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [statusFilter]);

  const counts = useMemo(() => {
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    return { total: records.length, present, absent, late };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Attendance</h1>
          <p className="text-slate-400 text-sm">Live records from your database</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/student/report/pdf"
            className="px-3 py-2 rounded bg-white/5 border border-white/10 text-slate-200 hover:border-neon-blue/40 hover:text-neon-blue transition-all"
          >
            Download PDF
          </a>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-800 border border-white/10 rounded px-3 py-2 text-slate-200"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Total" value={counts.total} />
        <Stat title="Present" value={counts.present} />
        <Stat title="Absent" value={counts.absent} />
        <Stat title="Late" value={counts.late} />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          <div className="p-6 text-slate-400">Loading attendance...</div>
        ) : error ? (
          <div className="p-6 text-neon-crimson">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-slate-400">No attendance records found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row._id} className="border-t border-white/5 text-slate-200">
                  <td className="px-4 py-3">
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {row.subjectId?.name || '-'} {row.subjectId?.code ? `(${row.subjectId.code})` : ''}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Stat = ({ title, value }: { title: string; value: number }) => (
  <div className="glass-panel rounded-lg p-4 border border-white/10">
    <p className="text-xs text-slate-400 uppercase tracking-wide">{title}</p>
    <p className="text-2xl font-bold text-neon-blue mt-1">{value}</p>
  </div>
);

export default Attendance;
