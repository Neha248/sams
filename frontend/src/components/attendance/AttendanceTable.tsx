import type { AttendanceStudent, AttendanceStatus } from './types';

interface AttendanceTableProps {
  students: AttendanceStudent[];
  attendanceData: Record<string, AttendanceStatus>;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

const statusSelectClass: Record<AttendanceStatus, string> = {
  present:
    'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  absent:
    'bg-rose-500/15 border-rose-400/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  late:
    'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
};

const AttendanceTable = ({
  students,
  attendanceData,
  onStatusChange
}: AttendanceTableProps) => (
  <section className="glass-panel rounded-2xl border border-neon-blue/15 overflow-hidden shadow-[0_0_24px_rgba(0,212,255,0.05)]">
    <div className="px-6 py-4 border-b border-white/10">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue">
        Student Roster
      </h2>
    </div>

    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-md border-b border-neon-blue/20">
          <tr>
            {['University Roll', 'Class Roll', 'Student Name', 'Status'].map((col) => (
              <th
                key={col}
                className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const status = attendanceData[student.studentId] ?? 'present';
            return (
              <tr
                key={student.studentId}
                className="border-b border-white/5 hover:bg-neon-blue/5 transition-colors"
              >
                <td className="px-5 py-4 text-sm text-slate-200 font-mono">
                  {student.universityRoll}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">{student.classRoll}</td>
                <td className="px-5 py-4 text-sm text-white font-medium">
                  {student.studentName}
                </td>
                <td className="px-5 py-4">
                  <select
                    value={status}
                    onChange={(e) =>
                      onStatusChange(student.studentId, e.target.value as AttendanceStatus)
                    }
                    className={`px-3 py-2 rounded-lg border text-sm capitalize cursor-pointer transition-all ${statusSelectClass[status]}`}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export default AttendanceTable;
