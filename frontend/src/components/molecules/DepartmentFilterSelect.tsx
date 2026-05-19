import { MaterialIcon } from '../atoms/MaterialIcon';
import type { DepartmentOption } from './DepartmentSelect';

type DepartmentFilterSelectProps = {
  departments: DepartmentOption[];
  value: string;
  onChange: (departmentId: string) => void;
  label?: string;
};

export function DepartmentFilterSelect({
  departments,
  value,
  onChange,
  label = 'Department',
}: DepartmentFilterSelectProps) {
  return (
    <div className="relative group min-w-[220px]">
      <label className="block text-label-md text-outline mb-1.5 ml-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 pr-10 text-body-sm text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
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
