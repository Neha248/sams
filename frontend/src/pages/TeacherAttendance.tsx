import { useEffect, useState } from 'react';
import api from '../lib/axios';

type StudentRow = {
  _id: string;
  userId?: { fullName?: string; userId?: string };
  rollNumber?: string;
};

type MarkRow = {
  studentId: string;
  status: 'present' | 'absent' | 'late';
};

const TeacherAttendance = () => {
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStudents = async () => {
    setError('');
    try {
      const q = new URLSearchParams();
      if (departmentId) q.append('departmentId', departmentId);
      if (semester) q.append('semester', semester);
      if (section) q.append('section', section);
      const res = (await api.get(`/teacher/students?${q.toString()}`)) as {
        data: StudentRow[];
      };
      setStudents(res.data || []);
      const initial: Record<string, 'present' | 'absent' | 'late'> = {};
      (res.data || []).forEach((s) => {
        initial[s._id] = 'present';
      });
      setMarks(initial);
    } catch (err) {
      setError(err as string);
    }
  };

  useEffect(() => {
    if (departmentId || semester || section) {
      void loadStudents();
    }
  }, [departmentId, semester, section]);

  const submit = async () => {
    setMessage('');
    setError('');
    try {
      const payload: { students: MarkRow[]; date: string; subjectId: string } = {
        students: students.map((s) => ({ studentId: s._id, status: marks[s._id] || 'present' })),
        date,
        subjectId,
      };
      await api.post('/teacher/attendance/mark', payload);
      setMessage('Attendance saved successfully.');
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>

      <div className="glass-panel rounded-xl border border-white/10 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="bg-navy-800 border border-white/10 rounded px-3 py-2" placeholder="Department ID" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
        <input className="bg-navy-800 border border-white/10 rounded px-3 py-2" placeholder="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
        <input className="bg-navy-800 border border-white/10 rounded px-3 py-2" placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} />
        <input className="bg-navy-800 border border-white/10 rounded px-3 py-2" placeholder="Subject ID" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
        <input type="date" className="bg-navy-800 border border-white/10 rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && <div className="text-neon-crimson">{error}</div>}
      {message && <div className="text-neon-blue">{message}</div>}

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-300 text-sm">
            <tr>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t border-white/5">
                <td className="px-4 py-3">{s.rollNumber || '-'}</td>
                <td className="px-4 py-3">{s.userId?.fullName || s.userId?.userId || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    className="bg-navy-800 border border-white/10 rounded px-2 py-1"
                    value={marks[s._id] || 'present'}
                    onChange={(e) => setMarks((prev) => ({ ...prev, [s._id]: e.target.value as 'present' | 'absent' | 'late' }))}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={submit} className="px-4 py-2 bg-neon-blue text-navy-900 rounded font-semibold">
        Save Attendance
      </button>
    </div>
  );
};

export default TeacherAttendance;
