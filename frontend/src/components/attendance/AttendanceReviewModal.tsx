import { X, Check, XCircle, Clock } from 'lucide-react';
import type { AttendanceStudent } from './types';
import AttendanceSummaryChart from './AttendanceSummaryChart';
import type { AttendanceChartSegment } from './types';

interface AttendanceReviewModalProps {
  open: boolean;
  present: AttendanceStudent[];
  absent: AttendanceStudent[];
  late: AttendanceStudent[];
  chartData: AttendanceChartSegment[];
  onClose: () => void;
}

const cohortCard = (tone: 'present' | 'absent' | 'late') => {
  const styles = {
    present: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      title: 'text-emerald-400',
      icon: Check
    },
    absent: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      title: 'text-rose-400',
      icon: XCircle
    },
    late: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      title: 'text-amber-400',
      icon: Clock
    }
  };
  return styles[tone];
};

const AttendanceReviewModal = ({
  open,
  present,
  absent,
  late,
  chartData,
  onClose
}: AttendanceReviewModalProps) => {
  if (!open) return null;

  const total = present.length + absent.length + late.length;

  const cohorts = [
    { key: 'present' as const, title: 'Present Students', students: present },
    { key: 'absent' as const, title: 'Absent Students', students: absent },
    { key: 'late' as const, title: 'Late Students', students: late }
  ];

  const summaryCards = [
    { label: 'Present Count', value: present.length, color: 'text-emerald-400' },
    { label: 'Absent Count', value: absent.length, color: 'text-rose-400' },
    { label: 'Late Count', value: late.length, color: 'text-amber-400' },
    { label: 'Total Students', value: total, color: 'text-neon-blue' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal
        aria-labelledby="review-modal-title"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl
          glass-panel border border-neon-blue/25 shadow-[0_0_40px_rgba(0,212,255,0.12)] p-6 md:p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <h2
            id="review-modal-title"
            className="text-2xl font-bold text-white tracking-wide"
          >
            Attendance Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {cohorts.map(({ key, title, students }) => {
            const style = cohortCard(key);
            const Icon = style.icon;
            return (
              <div
                key={key}
                className={`rounded-2xl border p-4 ${style.border} ${style.bg}`}
              >
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${style.title}`}>
                  {title}
                </h3>
                <ul className="space-y-2 max-h-36 overflow-y-auto">
                  {students.length === 0 ? (
                    <li className="text-slate-500 text-sm">None</li>
                  ) : (
                    students.map((s) => (
                      <li
                        key={s.studentId}
                        className="flex items-center gap-2 text-sm text-slate-200"
                      >
                        <Icon size={14} className={style.title} />
                        {s.studentName}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Attendance Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="glass-panel rounded-xl border border-white/10 p-4 text-center"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {chartData.length > 0 && (
          <AttendanceSummaryChart data={chartData} />
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/20 text-slate-300
              hover:border-neon-blue/40 hover:text-neon-blue transition-all"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReviewModal;
