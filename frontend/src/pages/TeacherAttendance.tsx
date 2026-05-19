import { useState, useMemo } from 'react';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceBulkBar from '../components/attendance/AttendanceBulkBar';
import AttendanceTable from '../components/attendance/AttendanceTable';
import AttendanceReviewModal from '../components/attendance/AttendanceReviewModal';
import type {
  AttendanceStatus,
  AttendanceStudent,
  FilterOption,
  AttendanceChartSegment
} from '../components/attendance/types';

// TODO: connect attendance API
// TODO: connect timetable collection
// TODO: connect attendance persistence
// TODO: connect realtime sync

const MOCK_DEPARTMENTS: FilterOption[] = [
  { id: 'cse', name: 'Computer Science (CSE)' },
  { id: 'ece', name: 'Electronics (ECE)' },
  { id: 'me', name: 'Mechanical (ME)' }
];

const MOCK_SECTIONS: FilterOption[] = [
  { id: 'a', name: 'Section A' },
  { id: 'b', name: 'Section B' },
  { id: 'c', name: 'Section C' }
];

const MOCK_SEMESTERS: FilterOption[] = [
  { id: '5', name: 'Semester 5' },
  { id: '6', name: 'Semester 6' },
  { id: '7', name: 'Semester 7' }
];

const MOCK_SUBJECTS: FilterOption[] = [
  { id: 'db', name: 'Database Systems' },
  { id: 'os', name: 'Operating Systems' },
  { id: 'cn', name: 'Computer Networks' }
];

const MOCK_STUDENTS: AttendanceStudent[] = [
  {
    studentId: 'stu-001',
    universityRoll: '22140101',
    classRoll: '12',
    studentName: 'Rahul Sharma'
  },
  {
    studentId: 'stu-002',
    universityRoll: '22140102',
    classRoll: '13',
    studentName: 'Aman Roy'
  },
  {
    studentId: 'stu-003',
    universityRoll: '22140103',
    classRoll: '14',
    studentName: 'Sourav Das'
  },
  {
    studentId: 'stu-004',
    universityRoll: '22140104',
    classRoll: '15',
    studentName: 'Priya Sen'
  },
  {
    studentId: 'stu-005',
    universityRoll: '22140105',
    classRoll: '16',
    studentName: 'Akash Das'
  },
  {
    studentId: 'stu-006',
    universityRoll: '22140106',
    classRoll: '17',
    studentName: 'Neha Gupta'
  }
];

const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const TeacherAttendance = () => {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateValue, setDateValue] = useState(todayIso);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleFetchStudents = () => {
    if (!selectedDept || !selectedSection || !selectedSem || !selectedSubject) {
      setError('Please select department, section, semester, and subject before fetching.');
      return;
    }

    setError(null);
    setLoading(true);
    setRosterLoaded(false);

    // Mock fetch — no API / database
    window.setTimeout(() => {
      const roster = MOCK_STUDENTS.map((s) => ({ ...s }));
      const initial: Record<string, AttendanceStatus> = {};

      roster.forEach((student, index) => {
        if (index === 1) initial[student.studentId] = 'absent';
        else if (index === 2) initial[student.studentId] = 'late';
        else initial[student.studentId] = 'present';
      });

      setStudents(roster);
      setAttendanceData(initial);
      setRosterLoaded(true);
      setLoading(false);
    }, 600);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkUpdate = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.studentId] = status;
    });
    setAttendanceData(updated);
  };

  const grouped = useMemo(() => {
    const present: AttendanceStudent[] = [];
    const absent: AttendanceStudent[] = [];
    const late: AttendanceStudent[] = [];

    students.forEach((s) => {
      const status = attendanceData[s.studentId] ?? 'present';
      if (status === 'present') present.push(s);
      else if (status === 'absent') absent.push(s);
      else late.push(s);
    });

    return { present, absent, late };
  }, [students, attendanceData]);

  const chartData: AttendanceChartSegment[] = useMemo(
    () =>
      [
        { name: 'Present', value: grouped.present.length, color: '#10b981' },
        { name: 'Absent', value: grouped.absent.length, color: '#f43f5e' },
        { name: 'Late', value: grouped.late.length, color: '#f59e0b' }
      ].filter((d) => d.value > 0),
    [grouped]
  );

  const handleSubmit = () => {
    if (students.length === 0) return;
    const unresolved = students.some((s) => !attendanceData[s.studentId]);
    if (unresolved) {
      setError('Assign a status to every student before submitting.');
      return;
    }
    setError(null);
    setShowReviewModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-[0.12em]">
          MARK ATTENDANCE
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
          Select class filters and mark student attendance
        </p>
      </header>

      <AttendanceFilters
        departments={MOCK_DEPARTMENTS}
        sections={MOCK_SECTIONS}
        semesters={MOCK_SEMESTERS}
        subjects={MOCK_SUBJECTS}
        selectedDept={selectedDept}
        selectedSection={selectedSection}
        selectedSem={selectedSem}
        selectedSubject={selectedSubject}
        dateValue={dateValue}
        loading={loading}
        error={error}
        onDeptChange={setSelectedDept}
        onSectionChange={setSelectedSection}
        onSemChange={setSelectedSem}
        onSubjectChange={setSelectedSubject}
        onDateChange={setDateValue}
        onFetch={handleFetchStudents}
      />

      {loading && !rosterLoaded && (
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {rosterLoaded && students.length > 0 && (
        <>
          <AttendanceBulkBar onBulkUpdate={handleBulkUpdate} />

          <AttendanceTable
            students={students}
            attendanceData={attendanceData}
            onStatusChange={handleStatusChange}
          />

          <section className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-10 py-3.5 rounded-xl font-bold text-navy-900 bg-neon-blue
                shadow-[0_0_24px_rgba(0,212,255,0.45)] hover:shadow-[0_0_32px_rgba(0,212,255,0.6)]
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              SUBMIT ATTENDANCE
            </button>
          </section>
        </>
      )}

      <AttendanceReviewModal
        open={showReviewModal}
        present={grouped.present}
        absent={grouped.absent}
        late={grouped.late}
        chartData={chartData}
        onClose={() => setShowReviewModal(false)}
      />
    </div>
  );
};

export default TeacherAttendance;
