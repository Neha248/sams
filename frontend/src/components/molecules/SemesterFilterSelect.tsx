import { MaterialIcon } from '../atoms/MaterialIcon';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type SemesterFilterSelectProps = {
  value: string;
  onChange: (semester: string) => void;
  label?: string;
};

export function SemesterFilterSelect({
  value,
  onChange,
  label = 'Semester',
}: SemesterFilterSelectProps) {
  return (
    <div className="relative group min-w-[160px]">
      <label className="block text-label-md text-outline mb-1.5 ml-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 pr-10 text-body-sm text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={String(s)}>
              Semester {s}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
          <MaterialIcon name="unfold_more" size="sm" />
        </div>
      </div>
    </div>
  );
}
