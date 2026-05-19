import { MaterialIcon } from '../atoms/MaterialIcon';

export type StudentTableRow = {
  rowKey: string;
  uniNo: string;
  name: string;
  semester: number;
  section: string;
  subjectName: string;
  subjectCode: string;
  total: number;
  statusType: 'present' | 'absent';
  count: number;
  isFirstOfStudent: boolean;
  isFirstOfSubject: boolean;
};

type StudentOverviewTableProps = {
  rows: StudentTableRow[];
  onDownload: () => void;
  downloading?: boolean;
};

export function StudentOverviewTable({ rows, onDownload, downloading }: StudentOverviewTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container/30">
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Uni No</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Semester</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Section</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Subject</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Attendance</th>
              <th className="px-6 py-4 text-label-md text-outline uppercase tracking-wider">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-on-surface-variant text-body-sm">
                  No students found. Try another department or search term.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.rowKey}
                  className={`hover:bg-primary/5 transition-colors ${
                    row.isFirstOfStudent ? 'bg-surface-container-low/30' : ''
                  } ${row.statusType === 'absent' ? 'bg-surface-container-low/10' : ''}`}
                >
                  <td className="px-6 py-3 text-body-sm font-medium text-on-surface">
                    {row.isFirstOfStudent ? row.uniNo : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm font-bold text-on-surface">
                    {row.isFirstOfStudent ? row.name : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                    {row.isFirstOfStudent ? row.semester : ''}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                    {row.isFirstOfStudent ? row.section : ''}
                  </td>
                  <td className="px-6 py-3">
                    {row.isFirstOfSubject ? (
                      <>
                        <p className="text-body-sm font-medium text-on-surface">{row.subjectName}</p>
                        <p className="text-label-md text-outline">{row.subjectCode}</p>
                      </>
                    ) : null}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-on-surface">
                    {row.isFirstOfSubject ? row.total : ''}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-md font-bold ${
                        row.statusType === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-error-container/40 text-error'
                      }`}
                    >
                      <MaterialIcon
                        name={row.statusType === 'present' ? 'check_circle' : 'cancel'}
                        size="sm"
                      />
                      {row.statusType === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-bold text-body-sm ${
                        row.statusType === 'present' ? 'text-green-700' : 'text-error'
                      }`}
                    >
                      {row.count}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant/20 flex justify-end bg-surface-container-low/20">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading || rows.length === 0}
          className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-lg text-label-md font-medium hover:bg-primary transition-all disabled:opacity-50"
        >
          <MaterialIcon name="download" size="sm" />
          {downloading ? 'Preparing file...' : 'Download CSV Report'}
        </button>
      </div>
    </div>
  );
}
