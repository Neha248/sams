import type { AnalyticsRecord, AttendanceStatus } from './types';

interface AnalyticsTableProps {
  rows: AnalyticsRecord[];
  searchQuery: string;
  page: number;
  pageSize: number;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
}

const statusClass: Record<AttendanceStatus, string> = {
  present:
    'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  absent:
    'bg-rose-500/15 border-rose-400/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  late:
    'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
};

const AnalyticsTable = ({
  rows,
  searchQuery,
  page,
  pageSize,
  onSearchChange,
  onPageChange
}: AnalyticsTableProps) => {
  const filtered = rows.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.universityRoll.toLowerCase().includes(q) ||
      r.classRoll.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <section className="glass-panel rounded-2xl border border-neon-blue/15 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue">
          Results Registry
        </h2>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search table…"
          className="w-full sm:w-64 px-4 py-2 rounded-xl bg-navy-900/80 border border-white/10 text-slate-100 text-sm
            focus:outline-none focus:border-neon-blue/50 transition-all"
        />
      </div>

      <div className="hidden md:block max-h-[400px] overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-md border-b border-neon-blue/20">
            <tr>
              {['University Roll', 'Class Roll', 'Name', 'Status'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={`${row.universityRoll}-${row.date}-${i}`}
                className="border-b border-white/5 hover:bg-neon-blue/5 transition-colors"
              >
                <td className="px-5 py-4 text-sm font-mono text-slate-200">{row.universityRoll}</td>
                <td className="px-5 py-4 text-sm text-slate-300">{row.classRoll}</td>
                <td className="px-5 py-4 text-sm text-white font-medium">{row.studentName}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg border text-xs capitalize ${statusClass[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-4 space-y-3 max-h-[400px] overflow-auto">
        {pageRows.map((row, i) => (
          <div
            key={`${row.universityRoll}-m-${i}`}
            className="rounded-xl border border-white/10 bg-navy-900/50 p-4 space-y-2 hover:border-neon-blue/30 transition-colors"
          >
            <p className="text-white font-medium">{row.studentName}</p>
            <p className="text-xs text-slate-400 font-mono">Uni: {row.universityRoll} · Class: {row.classRoll}</p>
            <span
              className={`inline-block px-3 py-1 rounded-lg border text-xs capitalize ${statusClass[row.status]}`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of{' '}
          {filtered.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 hover:border-neon-blue/40 transition-colors"
          >
            Prev
          </button>
          <span className="px-2 py-1 text-neon-blue">{safePage} / {totalPages}</span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 hover:border-neon-blue/40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsTable;
