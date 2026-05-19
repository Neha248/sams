import { MaterialIcon } from '../atoms/MaterialIcon';

export type FacultyRow = {
  id: string;
  name: string;
  email: string;
  subjectName: string;
  subjectCode: string;
  presentCount: number;
  absentCount: number;
};

type FacultyTableProps = {
  departmentLabel: string;
  faculty: FacultyRow[];
  searchQuery?: string;
  onAssignNew?: () => void;
};

export function FacultyTable({ departmentLabel, faculty, searchQuery = '', onAssignNew }: FacultyTableProps) {
  const filtered = faculty.filter(
    (f) =>
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card rounded-xl">
      <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
        <div>
          <h3 className="font-outfit text-headline-md text-on-surface">Departmental Faculty</h3>
          <p className="text-body-sm text-on-surface-variant">
            Active lecturers assigned to {departmentLabel} — attendance totals per subject.
          </p>
        </div>
        <button
          type="button"
          onClick={onAssignNew}
          className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md hover:bg-primary transition-all"
        >
          Assign New
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container/30">
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Subject</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Present</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Absent</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-body-sm">
                  No faculty records for this department.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                        <MaterialIcon name="person" className="text-secondary" />
                      </div>
                      <div>
                        <p className="text-body-md font-bold text-on-surface">{row.name}</p>
                        <p className="text-label-md text-outline">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-medium text-on-surface">{row.subjectName}</p>
                    <p className="text-label-md text-outline">{row.subjectCode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-label-md font-bold">
                      <MaterialIcon name="check_circle" size="sm" />
                      {row.presentCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container/40 text-error text-label-md font-bold">
                      <MaterialIcon name="cancel" size="sm" />
                      {row.absentCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="material-symbols-outlined text-outline hover:text-primary">
                      more_vert
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
