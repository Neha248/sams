import { MaterialIcon } from '../atoms/MaterialIcon';

export type TimetableTableRow = {
  id: string;
  uid: string;
  teacherName: string;
  teacherUid: string;
  teacherId: string;
  subjectName: string;
  subjectCode: string;
  subjectId: string;
  departmentName: string;
  departmentId: string;
  section: string;
  semester: number;
  day: string;
  startTime: string;
  endTime: string;
  timing: string;
  roomNo: string;
  isPublished: boolean;
};

type TimetableOverviewTableProps = {
  rows: TimetableTableRow[];
  onAddSlot?: () => void;
  addDisabled?: boolean;
  onEdit?: (row: TimetableTableRow) => void;
  onDelete?: (row: TimetableTableRow) => void;
  deletingId?: string | null;
};

export function TimetableOverviewTable({
  rows,
  onAddSlot,
  addDisabled,
  onEdit,
  onDelete,
  deletingId,
}: TimetableOverviewTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {onAddSlot ? (
        <div className="p-6 border-b border-outline-variant/20 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="font-outfit text-headline-md text-on-surface">Schedule Slots</h3>
            <p className="text-body-sm text-on-surface-variant">
              UID, teacher, subject, cohort, and timing for each class slot.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddSlot}
            disabled={addDisabled}
            className="shrink-0 inline-flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md hover:bg-primary transition-all disabled:opacity-50"
          >
            <MaterialIcon name="add" size="sm" />
            Add Slot
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
              {['UID', 'Teacher', 'Subject', 'Department', 'Section', 'Semester', 'Timing', 'Status', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-label-md font-bold text-outline uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant text-body-md">
                  No timetable slots match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-label-md text-secondary font-bold">{row.uid}</td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-semibold text-on-surface">{row.teacherName}</p>
                    <p className="text-label-md text-on-surface-variant">{row.teacherUid}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm text-on-surface">{row.subjectName}</p>
                    <p className="text-label-md text-on-surface-variant">{row.subjectCode}</p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface">{row.departmentName}</td>
                  <td className="px-6 py-4 text-body-sm font-medium text-on-surface">{row.section}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface">{row.semester}</td>
                  <td className="px-6 py-4">
                    <p className="text-body-sm text-on-surface">{row.timing}</p>
                    <p className="text-label-md text-on-surface-variant">Room {row.roomNo}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-label-md font-medium ${
                        row.isPublished
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {row.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="Edit slot"
                        >
                          <MaterialIcon name="edit" size="sm" />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          disabled={deletingId === row.id}
                          className="p-2 rounded-lg text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
                          title="Remove slot"
                        >
                          <MaterialIcon name="delete" size="sm" />
                        </button>
                      ) : null}
                    </div>
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
