import { useState, useMemo } from 'react';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';
import AnalyticsTable from '../components/analytics/AnalyticsTable';
import AttendanceOverviewChart from '../components/analytics/AttendanceOverviewChart';
import StudentTrendChart from '../components/analytics/StudentTrendChart';
import ExportPanel from '../components/analytics/ExportPanel';
import type {
  AnalyticsRecord,
  AttendanceStatus,
  ChartSegment,
  FilterOption,
  TrendPoint
} from '../components/analytics/types';

// TODO: connect analytics aggregation
// TODO: connect student attendance history
// TODO: connect export service
// TODO: connect PDF generation
// TODO: connect trend aggregation
// TODO: connect attendance analytics collection

const MOCK_DEPARTMENTS: FilterOption[] = [
  { id: 'cse', name: 'Computer Science (CSE)' },
  { id: 'ece', name: 'Electronics (ECE)' }
];

const MOCK_SEMESTERS: FilterOption[] = [
  { id: '5', name: 'Semester 5' },
  { id: '6', name: 'Semester 6' }
];

const MOCK_SECTIONS: FilterOption[] = [
  { id: 'a', name: 'Section A' },
  { id: 'b', name: 'Section B' }
];

const MOCK_SUBJECTS: FilterOption[] = [
  { id: 'db', name: 'Database Systems' },
  { id: 'os', name: 'Operating Systems' }
];

/** Mock read-only registry — future: GET /teacher/analytics */
const MOCK_REGISTRY: AnalyticsRecord[] = [
  { universityRoll: '22140101', classRoll: '12', studentName: 'Rahul Sharma', status: 'present', date: '01 Jan' },
  { universityRoll: '22140101', classRoll: '12', studentName: 'Rahul Sharma', status: 'absent', date: '02 Jan' },
  { universityRoll: '22140101', classRoll: '12', studentName: 'Rahul Sharma', status: 'present', date: '03 Jan' },
  { universityRoll: '22140101', classRoll: '12', studentName: 'Rahul Sharma', status: 'late', date: '04 Jan' },
  { universityRoll: '22140102', classRoll: '13', studentName: 'Aman Roy', status: 'absent', date: '01 Jan' },
  { universityRoll: '22140102', classRoll: '13', studentName: 'Aman Roy', status: 'present', date: '02 Jan' },
  { universityRoll: '22140103', classRoll: '14', studentName: 'Sourav Das', status: 'late', date: '01 Jan' },
  { universityRoll: '22140104', classRoll: '15', studentName: 'Priya Sen', status: 'present', date: '01 Jan' },
  { universityRoll: '22140105', classRoll: '16', studentName: 'Akash Das', status: 'absent', date: '01 Jan' },
  { universityRoll: '22140199', classRoll: '99', studentName: 'Rahul Sharma', status: 'present', date: '01 Jan' }
];

const PAGE_SIZE = 8;

const TeacherAnalytics = () => {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [studentName, setStudentName] = useState('');
  const [universityRoll, setUniversityRoll] = useState('');
  const [classRoll, setClassRoll] = useState('');
  const [statusFilters, setStatusFilters] = useState<AttendanceStatus[]>([
    'present',
    'absent',
    'late'
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambiguity, setAmbiguity] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [singleStudentMode, setSingleStudentMode] = useState(false);
  const [resolvedStudent, setResolvedStudent] = useState<string>('');

  const [results, setResults] = useState<AnalyticsRecord[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);

  const showIdentityPanel = studentName.trim().length > 0;

  const handleStatusToggle = (status: AttendanceStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const applyStatusFilter = (rows: AnalyticsRecord[]) => {
    if (statusFilters.length === 0) return rows;
    return rows.filter((r) => statusFilters.includes(r.status));
  };

  const handleGenerate = () => {
    if (!department || !semester || !section || !subject) {
      setError('Select department, semester, section, and subject to extract analytics.');
      setHasGenerated(false);
      return;
    }

    const nameQuery = studentName.trim().toLowerCase();

    if (nameQuery && !universityRoll.trim() && !classRoll.trim()) {
      const nameMatches = MOCK_REGISTRY.filter((r) =>
        r.studentName.toLowerCase().includes(nameQuery)
      );
      const uniqueKeys = new Set(
        nameMatches.map((r) => `${r.universityRoll}-${r.classRoll}`)
      );
      if (uniqueKeys.size > 1) {
        setAmbiguity(true);
        setError('Multiple students found. Provide University Roll or Class Roll.');
        setHasGenerated(false);
        return;
      }
      if (uniqueKeys.size === 0) {
        setAmbiguity(false);
        setError('No matching student found.');
        setHasGenerated(false);
        return;
      }
    }

    setError(null);
    setAmbiguity(false);
    setLoading(true);
    setPage(1);

    window.setTimeout(() => {
      let extracted = [...MOCK_REGISTRY];

      if (nameQuery) {
        extracted = extracted.filter((r) => r.studentName.toLowerCase().includes(nameQuery));
        if (universityRoll.trim()) {
          extracted = extracted.filter((r) => r.universityRoll === universityRoll.trim());
        }
        if (classRoll.trim()) {
          extracted = extracted.filter((r) => r.classRoll === classRoll.trim());
        }
        if (extracted.length === 0) {
          setError('No matching student found.');
          setResults([]);
          setTrendData([]);
          setHasGenerated(true);
          setLoading(false);
          return;
        }

        const student = extracted[0].studentName;
        setSingleStudentMode(true);
        setResolvedStudent(student);

        const filtered = applyStatusFilter(extracted);
        setResults(filtered);

        const trendMap = new Map<string, TrendPoint>();
        extracted.forEach((r) => {
          const existing = trendMap.get(r.date) ?? {
            date: r.date,
            present: 0,
            absent: 0,
            late: 0
          };
          existing[r.status] += 1;
          trendMap.set(r.date, existing);
        });
        setTrendData(Array.from(trendMap.values()));
      } else {
        setSingleStudentMode(false);
        setResolvedStudent('');

        const latestByStudent = new Map<string, AnalyticsRecord>();
        MOCK_REGISTRY.forEach((r) => {
          const key = r.universityRoll;
          latestByStudent.set(key, r);
        });
        const cohortRows = Array.from(latestByStudent.values());
        setResults(applyStatusFilter(cohortRows));
        setTrendData([]);
      }

      setHasGenerated(true);
      setLoading(false);
    }, 700);
  };

  const overviewData: ChartSegment[] = useMemo(() => {
    const present = results.filter((r) => r.status === 'present').length;
    const absent = results.filter((r) => r.status === 'absent').length;

    if (singleStudentMode) {
      return [
        { name: 'Present', value: present, color: '#10b981' },
        { name: 'Absent', value: absent, color: '#f43f5e' }
      ].filter((d) => d.value > 0);
    }

    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#f43f5e' }
    ].filter((d) => d.value > 0);
  }, [results, singleStudentMode]);

  const summaryStats = useMemo(() => {
    const present = results.filter((r) => r.status === 'present').length;
    const absent = results.filter((r) => r.status === 'absent').length;
    const late = results.filter((r) => r.status === 'late').length;
    return { present, absent, late, total: results.length };
  }, [results]);

  const handleExportCsv = () => {
    const header = 'University Roll,Class Roll,Student Name,Status,Date\n';
    const rows = results
      .map(
        (r) =>
          `${r.universityRoll},${r.classRoll},"${r.studentName}",${r.status},${r.date}`
      )
      .join('\n');
    const meta = [
      `# SAMS Analytics Export`,
      `# Department: ${department}`,
      `# Semester: ${semester}`,
      `# Section: ${section}`,
      `# Subject: ${subject}`,
      `# Present: ${summaryStats.present} Absent: ${summaryStats.absent} Late: ${summaryStats.late}`,
      `# Charts snapshot: deferred`,
      ''
    ].join('\n');

    const blob = new Blob([meta + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sams-analytics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <header className="glass-panel rounded-2xl border border-neon-blue/20 p-6 md:p-8 shadow-[0_0_30px_rgba(0,212,255,0.08)]">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-[0.12em] glow-blue">
          ANALYTICS CONSOLE
        </h1>
        <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl">
          Attendance extraction and compliance analysis terminal
        </p>
      </header>

      <AnalyticsFilters
        departments={MOCK_DEPARTMENTS}
        semesters={MOCK_SEMESTERS}
        sections={MOCK_SECTIONS}
        subjects={MOCK_SUBJECTS}
        department={department}
        semester={semester}
        section={section}
        subject={subject}
        studentName={studentName}
        universityRoll={universityRoll}
        classRoll={classRoll}
        statusFilters={statusFilters}
        loading={loading}
        showIdentityPanel={showIdentityPanel}
        onDepartmentChange={setDepartment}
        onSemesterChange={setSemester}
        onSectionChange={setSection}
        onSubjectChange={setSubject}
        onStudentNameChange={setStudentName}
        onUniversityRollChange={setUniversityRoll}
        onClassRollChange={setClassRoll}
        onStatusToggle={handleStatusToggle}
        onGenerate={handleGenerate}
      />

      {error && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border ${
            ambiguity
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-neon-crimson/10 border-neon-crimson/30 text-neon-crimson'
          }`}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl h-40 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      )}

      {hasGenerated && !loading && results.length === 0 && !error && (
        <div className="glass-panel rounded-2xl p-10 text-center text-slate-400">
          No records found for the selected extraction parameters.
        </div>
      )}

      {hasGenerated && !loading && results.length > 0 && (
        <>
          <AnalyticsTable
            rows={results}
            searchQuery={tableSearch}
            page={page}
            pageSize={PAGE_SIZE}
            onSearchChange={setTableSearch}
            onPageChange={setPage}
          />

          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue">
              Analytics Section
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Present', value: summaryStats.present, color: 'text-emerald-400' },
                { label: 'Absent', value: summaryStats.absent, color: 'text-rose-400' },
                { label: 'Late', value: summaryStats.late, color: 'text-amber-400' },
                { label: 'Total', value: summaryStats.total, color: 'text-neon-blue' }
              ].map((card) => (
                <div
                  key={card.label}
                  className="glass-panel rounded-xl border border-white/10 p-4 text-center"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className={`grid gap-6 ${singleStudentMode ? 'lg:grid-cols-2' : ''}`}>
              {overviewData.length > 0 && (
                <AttendanceOverviewChart
                  title={singleStudentMode ? 'Present vs Absent' : 'Cohort — Present vs Absent'}
                  data={overviewData}
                />
              )}
              {singleStudentMode && trendData.length > 0 && (
                <StudentTrendChart data={trendData} studentName={resolvedStudent} />
              )}
            </div>
          </section>

          <ExportPanel disabled={results.length === 0} onExportCsv={handleExportCsv} />
        </>
      )}
    </div>
  );
};

export default TeacherAnalytics;
