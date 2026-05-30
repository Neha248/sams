import type { SubjectWiseAttendanceRow } from './types';

const SAFE_THRESHOLD = 75;

type SubjectAttendanceTableProps = {
  rows: SubjectWiseAttendanceRow[];
  emptyMessage?: string;
};

const StatusChip = ({
  label,
  count,
  pct,
  variant,
}: {
  label: string;
  count: number;
  pct: number;
  variant: 'present' | 'late' | 'absent';
}) => {
  const styles = {
    present: 'border-neon-blue/40 bg-neon-blue/15 text-neon-blue',
    late: 'border-amber-400/40 bg-amber-400/15 text-amber-400',
    absent: 'border-neon-crimson/40 bg-neon-crimson/15 text-neon-crimson',
  }[variant];

  return (
    <div className={`rounded-lg border px-3 py-2 min-w-[88px] ${styles}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-lg font-bold leading-tight">{count}</p>
      <p className="text-xs font-medium">{pct}%</p>
    </div>
  );
};

const SubjectAttendanceTable = ({
  rows,
  emptyMessage = 'No subject attendance records yet. Run npm run seed in backend if this is a fresh database.',
}: SubjectAttendanceTableProps) => (
  <section className="glass-panel rounded-xl border border-white/10 overflow-hidden">
    <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-white">Subject-wise attendance</h2>
        <p className="text-slate-400 text-sm mt-1">
          Each subject shows <span className="text-neon-blue">present</span>,{' '}
          <span className="text-amber-400">late</span>, and{' '}
          <span className="text-neon-crimson">absent</span> counts with %. Safe zone = every subject ≥
          {SAFE_THRESHOLD}% present.
        </p>
      </div>
    </div>
    {rows.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-300 text-sm">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3 min-w-[280px]">Present / Late / Absent</th>
              <th className="px-4 py-3 min-w-[200px]">Visual breakdown</th>
              <th className="px-4 py-3">Attendance %</th>
              <th className="px-4 py-3">Eff. absent</th>
              <th className="px-4 py-3">Need for 75%</th>
              <th className="px-4 py-3">Zone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = row.percentage ?? row.presentPct ?? 0;
              const isSafe = row.isSafe ?? pct >= SAFE_THRESHOLD;
              const total = row.total ?? 0;
              const present = row.present ?? 0;
              const late = row.late ?? 0;
              const absent = row.absent ?? 0;
              const presentPct = row.presentPct ?? (total > 0 ? Math.round((present / total) * 1000) / 10 : 0);
              const latePct = row.latePct ?? (total > 0 ? Math.round((late / total) * 1000) / 10 : 0);
              const absentPct = row.absentPct ?? (total > 0 ? Math.round((absent / total) * 1000) / 10 : 0);

              return (
                <tr
                  key={row._id || `${row.subjectCode}-${row.subjectName}`}
                  className={`border-t border-white/5 ${
                    isSafe ? 'bg-neon-blue/[0.03]' : 'bg-neon-crimson/[0.06]'
                  }`}
                >
                  <td className="px-4 py-3 align-top">
                    <span className="font-medium text-white block">{row.subjectName || '—'}</span>
                    {row.subjectCode ? (
                      <span className="text-slate-500 text-sm">({row.subjectCode})</span>
                    ) : null}
                    <p className="text-xs text-slate-500 mt-1">Total classes: {total}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <StatusChip label="Present" count={present} pct={presentPct} variant="present" />
                      <StatusChip label="Late" count={late} pct={latePct} variant="late" />
                      <StatusChip label="Absent" count={absent} pct={absentPct} variant="absent" />
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-2">
                      <div className="flex h-4 rounded-full overflow-hidden border border-white/10 bg-navy-900">
                        <div
                          className="bg-neon-blue flex items-center justify-center text-[9px] font-bold text-navy-950 min-w-0"
                          style={{ width: `${Math.max(presentPct, present > 0 ? 8 : 0)}%` }}
                          title={`Present ${present} (${presentPct}%)`}
                        >
                          {present > 0 && presentPct >= 12 ? `${presentPct}%` : ''}
                        </div>
                        <div
                          className="bg-amber-400 flex items-center justify-center text-[9px] font-bold text-navy-950 min-w-0"
                          style={{ width: `${Math.max(latePct, late > 0 ? 8 : 0)}%` }}
                          title={`Late ${late} (${latePct}%)`}
                        >
                          {late > 0 && latePct >= 12 ? `${latePct}%` : ''}
                        </div>
                        <div
                          className="bg-neon-crimson flex items-center justify-center text-[9px] font-bold text-white min-w-0"
                          style={{ width: `${Math.max(absentPct, absent > 0 ? 8 : 0)}%` }}
                          title={`Absent ${absent} (${absentPct}%)`}
                        >
                          {absent > 0 && absentPct >= 12 ? `${absentPct}%` : ''}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        <span className="text-neon-blue">■</span> Present {presentPct}% &nbsp;
                        <span className="text-amber-400">■</span> Late {latePct}% &nbsp;
                        <span className="text-neon-crimson">■</span> Absent {absentPct}%
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`text-xl font-bold block ${isSafe ? 'text-neon-blue' : 'text-neon-crimson'}`}
                    >
                      {pct}%
                    </span>
                    <span className="text-[10px] text-slate-500">(present ÷ total)</span>
                    <div className="h-2 mt-2 rounded-full bg-navy-800 overflow-hidden border border-white/5 relative">
                      <div
                        className="absolute top-0 bottom-0 w-px bg-white/50 z-10"
                        style={{ left: `${SAFE_THRESHOLD}%` }}
                      />
                      <div
                        className={`h-full ${isSafe ? 'bg-neon-blue' : 'bg-neon-crimson'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    <span className="text-neon-crimson font-semibold">{row.effectiveAbsent ?? 0}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {row.lateAsAbsent ?? 0} from late (2=1)
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {(row.classesNeeded ?? 0) > 0 ? (
                      <span className="text-neon-crimson font-bold text-sm">
                        +{row.classesNeeded} present
                      </span>
                    ) : (
                      <span className="text-neon-blue text-sm font-semibold">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded inline-block ${
                        isSafe
                          ? 'text-neon-blue bg-neon-blue/10 border border-neon-blue/30'
                          : 'text-neon-crimson bg-neon-crimson/10 border border-neon-crimson/30'
                      }`}
                    >
                      {isSafe ? 'Safe zone' : 'Below safe zone'}
                    </span>
                    {!isSafe && row.suggestion && (
                      <p
                        className={`text-[11px] mt-2 leading-snug max-w-[220px] ${
                          row.canReachSafeZone ? 'text-neon-blue' : 'text-amber-300'
                        }`}
                      >
                        {row.suggestion}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="px-6 py-8 text-slate-400 text-sm">{emptyMessage}</p>
    )}
  </section>
);

export default SubjectAttendanceTable;
