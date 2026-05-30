import { useEffect, useMemo, useState } from 'react';
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

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const TIME_SLOTS = [
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
] as const;

const normalizeTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h}:${String(m ?? 0).padStart(2, '0')}`;
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

  const grid = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entries) {
      const key = `${e.day}|${normalizeTime(e.startTime)}`;
      map.set(key, e);
    }
    return map;
  }, [entries]);

  const endTimeForSlot = (start: string) => {
    const hour = parseInt(start.split(':')[0], 10);
    return `${hour + 1}:00`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Weekly Timetable</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monday – Friday · 9:00 AM – 4:00 PM · Different subject each period
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          <div className="p-6 text-slate-400">Loading timetable...</div>
        ) : error ? (
          <div className="p-6 text-neon-crimson">{error}</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-slate-400">No timetable published yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase w-24">
                    Time
                  </th>
                  {WEEKDAYS.map((day) => (
                    <th
                      key={day}
                      className="px-3 py-3 text-xs font-semibold text-neon-blue uppercase text-center"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="border-t border-white/5">
                    <td className="px-3 py-3 text-sm font-mono text-slate-400 whitespace-nowrap">
                      {slot} – {endTimeForSlot(slot)}
                    </td>
                    {WEEKDAYS.map((day) => {
                      const cell = grid.get(`${day}|${slot}`);
                      return (
                        <td key={day} className="px-2 py-2 align-top">
                          {cell ? (
                            <div className="rounded-lg border border-neon-blue/20 bg-neon-blue/5 p-2.5 h-full min-h-[72px] hover:border-neon-blue/40 transition-colors">
                              <p className="text-xs font-bold text-white leading-tight">
                                {cell.subjectId?.name}
                              </p>
                              <p className="text-[10px] text-neon-blue mt-0.5">
                                {cell.subjectId?.code}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 truncate">
                                {cell.teacherId?.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500">Room {cell.roomNo}</p>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-white/5 p-2.5 min-h-[72px] flex items-center justify-center">
                              <span className="text-[10px] text-slate-600">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
