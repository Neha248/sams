import { MaterialIcon } from '../atoms/MaterialIcon';

export type TeacherAssignmentTableRow = {
  rowKey: string;
  profileId: string;
  uniqueId: string;
  teacherName: string;
  email: string;
  assignedAt: string;
  subjectName: string;
  subjectCode: string;
  departmentName: string;
  semester: number;
  isFirstOfTeacher: boolean;
};

type TeacherAssignmentsTableProps = {
  rows: TeacherAssignmentTableRow[];
  onAssignNew?: () => void;
  assignDisabled?: boolean;
  onRemoveTeacher?: (profileId: string, teacherName: string) => void;
  removingProfileId?: string | null;
};

function formatAssignedDate(iso: string): string {
  if (!iso || iso === '—') return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function TeacherAssignmentsTable({
  rows,
  onAssignNew,
  assignDisabled,
  onRemoveTeacher,
  removingProfileId,
}: TeacherAssignmentsTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {onAssignNew ? (
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center gap-4">
          <div>
            <h3 className="font-outfit text-headline-md text-on-surface">Teacher Assignments</h3>
            <p className="text-body-sm text-on-surface-variant">
              One row per teacher and subject. Use filters above, then assign new lecturers.
            </p>
          </div>
          <button
            type="button"
            onClick={onAssignNew}
            disabled={assignDisabled}
            className="shrink-0 inline-flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md hover:bg-primary transition-all disabled:opacity-50"
          >
            <MaterialIcon name="person_add" size="sm" />
            Assign New Teacher
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container/30">
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Unique ID</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Teacher Name</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Date Assigned</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Subject</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Semester</th>
              {onRemoveTeacher ? (
                <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider text-right">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={onRemoveTeacher ? 8 : 7}
                  className="px-6 py-10 text-center text-on-surface-variant text-body-sm"
                >
                  No teachers found. Try another filter or search term.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.rowKey}
                  className={`hover:bg-primary/5 transition-colors ${
                    row.isFirstOfTeacher ? 'bg-surface-container-low/30' : ''
                  }`}
                >
                  <td className="px-6 py-3 text-body-sm font-mono font-medium text-on-surface">
                    {row.isFirstOfTeacher ? row.uniqueId : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm font-bold text-on-surface">
                    {row.isFirstOfTeacher ? row.teacherName : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                    {row.isFirstOfTeacher ? row.email : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                    {formatAssignedDate(row.assignedAt)}
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-body-sm font-medium text-on-surface">{row.subjectName}</p>
                    <p className="text-label-md text-outline">{row.subjectCode}</p>
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface">{row.departmentName}</td>
                  <td className="px-6 py-3 text-body-sm font-medium text-on-surface">{row.semester || '—'}</td>
                  {onRemoveTeacher ? (
                    <td className="px-6 py-3 text-right">
                      {row.isFirstOfTeacher ? (
                        <button
                          type="button"
                          onClick={() => onRemoveTeacher(row.profileId, row.teacherName)}
                          disabled={removingProfileId === row.profileId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-medium text-error border border-error/30 hover:bg-error-container/30 transition-all disabled:opacity-50"
                        >
                          <MaterialIcon name="person_remove" size="sm" />
                          {removingProfileId === row.profileId ? 'Removing...' : 'Remove'}
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
