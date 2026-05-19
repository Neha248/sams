import type { AttendanceStatus } from './types';

interface AttendanceBulkBarProps {
  onBulkUpdate: (status: AttendanceStatus) => void;
}

const bulkActions: { status: AttendanceStatus; label: string; glow: string }[] = [
  {
    status: 'present',
    label: 'MARK ALL PRESENT',
    glow: 'hover:shadow-[0_0_16px_rgba(16,185,129,0.35)] hover:border-emerald-400/50'
  },
  {
    status: 'absent',
    label: 'MARK ALL ABSENT',
    glow: 'hover:shadow-[0_0_16px_rgba(244,63,94,0.35)] hover:border-rose-400/50'
  },
  {
    status: 'late',
    label: 'MARK ALL LATE',
    glow: 'hover:shadow-[0_0_16px_rgba(245,158,11,0.35)] hover:border-amber-400/50'
  }
];

const AttendanceBulkBar = ({ onBulkUpdate }: AttendanceBulkBarProps) => (
  <section className="glass-panel rounded-2xl border border-white/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">
      Bulk Status Update
    </h2>
    <div className="flex flex-wrap gap-3 justify-end">
      {bulkActions.map(({ status, label, glow }) => (
        <button
          key={status}
          type="button"
          onClick={() => onBulkUpdate(status)}
          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border border-white/15
            bg-navy-900/80 text-slate-200 transition-all duration-200 ${glow}`}
        >
          {label}
        </button>
      ))}
    </div>
  </section>
);

export default AttendanceBulkBar;
