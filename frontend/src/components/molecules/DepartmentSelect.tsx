import { MaterialIcon } from '../atoms/MaterialIcon';

export type DepartmentOption = {
  id: string;
  code: string;
  name: string;
};

type DepartmentSelectProps = {
  departments: DepartmentOption[];
  value: string;
  onChange: (departmentId: string) => void;
};

export function DepartmentSelect({ departments, value, onChange }: DepartmentSelectProps) {
  return (
    <div className="relative group">
      <label className="block text-label-md text-outline mb-1.5 ml-2">Select Unit</label>
      <div className="relative min-w-[280px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-5 py-3.5 pr-12 font-title-lg text-title-lg text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
          <MaterialIcon name="unfold_more" />
        </div>
      </div>
    </div>
  );
}
