import { useEffect, useState } from 'react';
import api from '../lib/axios';

type StudentPerf = {
  studentName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

const TeacherAnalytics = () => {
  const [rows, setRows] = useState<StudentPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = (await api.get('/teacher/analytics')) as {
          data: { all: StudentPerf[]; above75: StudentPerf[]; below75: StudentPerf[] };
        };
        setRows(res.data.all || []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teacher Analytics</h1>
          <p className="text-slate-400 text-sm">Class performance summary</p>
        </div>
        <a
          href="/api/teacher/report/pdf"
          className="px-3 py-2 rounded bg-white/5 border border-white/10 text-slate-200 hover:border-neon-blue/40 hover:text-neon-blue transition-all"
        >
          Download PDF
        </a>
      </div>
      {loading ? (
        <div className="text-slate-400">Loading analytics...</div>
      ) : error ? (
        <div className="text-neon-crimson">{error}</div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Late</th>
                <th className="px-4 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.studentName}-${i}`} className="border-t border-white/5">
                  <td className="px-4 py-3">{r.studentName}</td>
                  <td className="px-4 py-3">{r.total}</td>
                  <td className="px-4 py-3">{r.present}</td>
                  <td className="px-4 py-3">{r.absent}</td>
                  <td className="px-4 py-3">{r.late}</td>
                  <td className="px-4 py-3">{r.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherAnalytics;
