import type { AttendanceStatus, FilterOption } from './types';

interface AnalyticsFiltersProps {
  departments: FilterOption[];
  semesters: FilterOption[];
  sections: FilterOption[];
  subjects: FilterOption[];
  department: string;
  semester: string;
  section: string;
  subject: string;
  studentName: string;
  universityRoll: string;
  classRoll: string;
  statusFilters: AttendanceStatus[];
  loading: boolean;
  showIdentityPanel: boolean;
  onDepartmentChange: (v: string) => void;
  onSemesterChange: (v: string) => void;
  onSectionChange: (v: string) => void;
  onSubjectChange: (v: string) => void;
  onStudentNameChange: (v: string) => void;
  onUniversityRollChange: (v: string) => void;
  onClassRollChange: (v: string) => void;
  onStatusToggle: (status: AttendanceStatus) => void;
  onGenerate: () => void;
}

const selectClass =
  'w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-white/10 text-slate-100 text-sm ' +
  'focus:outline-none focus:border-neon-blue/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all';

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: 'present', label: 'Present', active: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' },
  { value: 'absent', label: 'Absent', active: 'border-rose-400/50 bg-rose-500/15 text-rose-300' },
  { value: 'late', label: 'Late', active: 'border-amber-400/50 bg-amber-500/15 text-amber-300' }
];

const AnalyticsFilters = ({
  departments,
  semesters,
  sections,
  subjects,
  department,
  semester,
  section,
  subject,
  studentName,
  universityRoll,
  classRoll,
  statusFilters,
  loading,
  showIdentityPanel,
  onDepartmentChange,
  onSemesterChange,
  onSectionChange,
  onSubjectChange,
  onStudentNameChange,
  onUniversityRollChange,
  onClassRollChange,
  onStatusToggle,
  onGenerate
}: AnalyticsFiltersProps) => (
  <section className="glass-panel rounded-2xl border border-neon-blue/20 p-6 md:p-8 shadow-[0_0_30px_rgba(0,212,255,0.06)] space-y-6">
    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue">
      Extraction Filters
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className={labelClass} htmlFor="an-dept">Department</label>
        <select id="an-dept" value={department} onChange={(e) => onDepartmentChange(e.target.value)} className={selectClass}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="an-sem">Semester</label>
        <select id="an-sem" value={semester} onChange={(e) => onSemesterChange(e.target.value)} className={selectClass}>
          <option value="">Select semester</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="an-sec">Section</label>
        <select id="an-sec" value={section} onChange={(e) => onSectionChange(e.target.value)} className={selectClass}>
          <option value="">Select section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="an-sub">Subject</label>
        <select id="an-sub" value={subject} onChange={(e) => onSubjectChange(e.target.value)} className={selectClass}>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="border-t border-white/10 pt-6 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        Student Search Panel
      </h3>
      <div>
        <label className={labelClass} htmlFor="an-student">Student Name</label>
        <input
          id="an-student"
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Enter student name"
          className={selectClass}
        />
        <p className="mt-2 text-xs text-slate-500">
          Leave empty for all students within department, semester, section, and subject.
        </p>
      </div>

      {showIdentityPanel && (
        <div className="glass-panel rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <p className="text-sm text-amber-200/90">
            Provide <strong>University Roll</strong> or <strong>Class Roll</strong> to uniquely identify the student.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="an-uni-roll">University Roll Number</label>
              <input
                id="an-uni-roll"
                type="text"
                value={universityRoll}
                onChange={(e) => onUniversityRollChange(e.target.value)}
                placeholder="e.g. 22140101"
                className={selectClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="an-class-roll">Class Roll Number</label>
              <input
                id="an-class-roll"
                type="text"
                value={classRoll}
                onChange={(e) => onClassRollChange(e.target.value)}
                placeholder="e.g. 12"
                className={selectClass}
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <span className={labelClass}>Status Filter</span>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map(({ value, label, active }) => {
            const selected = statusFilters.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusToggle(value)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                  selected ? active : 'border-white/10 bg-navy-900/60 text-slate-400 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>

    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="px-8 py-3 rounded-xl font-bold text-navy-900 bg-neon-blue
          shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_28px_rgba(0,212,255,0.55)]
          hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Extracting…' : 'GENERATE ANALYSIS'}
      </button>
    </div>
  </section>
);

export default AnalyticsFilters;
