import type { FilterOption } from './types';

interface AttendanceFiltersProps {
  departments: FilterOption[];
  sections: FilterOption[];
  semesters: FilterOption[];
  subjects: FilterOption[];
  selectedDept: string;
  selectedSection: string;
  selectedSem: string;
  selectedSubject: string;
  dateValue: string;
  loading: boolean;
  error: string | null;
  onDeptChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onSemChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFetch: () => void;
}

const selectClass =
  'w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-white/10 text-slate-100 text-sm ' +
  'focus:outline-none focus:border-neon-blue/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all';

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2';

const AttendanceFilters = ({
  departments,
  sections,
  semesters,
  subjects,
  selectedDept,
  selectedSection,
  selectedSem,
  selectedSubject,
  dateValue,
  loading,
  error,
  onDeptChange,
  onSectionChange,
  onSemChange,
  onSubjectChange,
  onDateChange,
  onFetch
}: AttendanceFiltersProps) => (
  <section className="glass-panel rounded-2xl border border-neon-blue/20 p-6 md:p-8 shadow-[0_0_30px_rgba(0,212,255,0.06)]">
    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue mb-6">
      Class Filters
    </h2>

    {error && (
      <div className="mb-5 px-4 py-3 rounded-xl bg-neon-crimson/10 border border-neon-crimson/30 text-neon-crimson text-sm">
        {error}
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div>
        <label className={labelClass} htmlFor="filter-dept">
          Department
        </label>
        <select
          id="filter-dept"
          value={selectedDept}
          onChange={(e) => onDeptChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-section">
          Section
        </label>
        <select
          id="filter-section"
          value={selectedSection}
          onChange={(e) => onSectionChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-sem">
          Semester
        </label>
        <select
          id="filter-sem"
          value={selectedSem}
          onChange={(e) => onSemChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select semester</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-subject">
          Subject
        </label>
        <select
          id="filter-subject"
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="filter-date">
          Date
        </label>
        <input
          id="filter-date"
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          className={selectClass}
        />
      </div>
    </div>

    <div className="mt-6 flex justify-end">
      <button
        type="button"
        onClick={onFetch}
        disabled={loading}
        className="px-8 py-3 rounded-xl font-bold text-navy-900 bg-neon-blue
          shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_28px_rgba(0,212,255,0.55)]
          hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Loading…' : 'FETCH STUDENTS'}
      </button>
    </div>
  </section>
);

export default AttendanceFilters;
