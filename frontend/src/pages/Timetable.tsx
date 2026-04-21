import { useEffect, useState } from 'react';
import api from '../lib/axios';

type Entry = {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
  subjectId?: { name?: string; code?: string };
  teacherId?: { fullName?: string };
};

const Timetable = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      setError('');
      try {
        const res = (await api.get('/student/timetable')) as { data: Entry[] };
        setEntries(res.data || []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Timetable</h1>
        <p className="text-slate-400 text-sm">Weekly schedule from backend</p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          <div className="p-6 text-slate-400">Loading timetable...</div>
        ) : error ? (
          <div className="p-6 text-neon-crimson">{error}</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-slate-400">No timetable published yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Room</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row._id} className="border-t border-white/5 text-slate-200">
                  <td className="px-4 py-3 capitalize">{row.day}</td>
                  <td className="px-4 py-3">{row.startTime} - {row.endTime}</td>
                  <td className="px-4 py-3">
                    {row.subjectId?.name || '-'} {row.subjectId?.code ? `(${row.subjectId.code})` : ''}
                  </td>
                  <td className="px-4 py-3">{row.teacherId?.fullName || '-'}</td>
                  <td className="px-4 py-3">{row.roomNo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Timetable;
