import { MaterialIcon } from '../atoms/MaterialIcon';
import { GhostIcon } from '../atoms/GhostIcon';
import { TrendChip } from '../atoms/TrendChip';

export type DashboardMetrics = {
  totalStudents: number;
  totalTeachers: number;
  totalSections: number;
  averagePresence: number;
  averageAbsence: number;
  teachersAssigned: number;
};

type MetricBentoGridProps = {
  metrics: DashboardMetrics;
  animate?: boolean;
};

export function MetricBentoGrid({ metrics, animate }: MetricBentoGridProps) {
  const cardClass = `glass-card rounded-xl p-6 group transition-all duration-300 ${
    animate ? 'opacity-50 translate-y-2' : 'opacity-100 translate-y-0'
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-gutter">
      {/* Total Students */}
      <article className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
            <MaterialIcon name="group" size="lg" />
          </div>
          <TrendChip variant="up" label="+12%" showTrendIcon />
        </div>
        <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Total Students</h3>
        <div className="flex items-baseline gap-2">
          <p className="font-display-lg text-[32px] text-on-surface font-bold">{metrics.totalStudents}</p>
          <p className="text-on-surface-variant text-body-sm">Enrolled</p>
        </div>
        <div className="mt-4 h-12 w-full overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path
              className="opacity-30"
              d="M0 15 Q 10 5, 20 12 T 40 10 T 60 15 T 80 8 T 100 12"
              fill="none"
              stroke="#0058be"
              strokeWidth="2"
            />
            <path
              className="opacity-10"
              d="M0 20 L 0 15 Q 10 5, 20 12 T 40 10 T 60 15 T 80 8 T 100 12 L 100 20 Z"
              fill="url(#gradStudents)"
            />
            <defs>
              <linearGradient id="gradStudents" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#0058be" stopOpacity={1} />
                <stop offset="100%" stopColor="#0058be" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <GhostIcon name="group" />
      </article>

      {/* Total Teachers */}
      <article className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-secondary-container/10 flex items-center justify-center text-secondary">
            <MaterialIcon name="school" size="lg" />
          </div>
          <TrendChip variant="stable" label="Stable" />
        </div>
        <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Total Teachers</h3>
        <div className="flex items-baseline gap-2">
          <p className="font-display-lg text-[32px] text-on-surface font-bold">{metrics.totalTeachers}</p>
          <p className="text-on-surface-variant text-body-sm">Active Faculty</p>
        </div>
        <div className="mt-4 h-12 w-full overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path
              className="opacity-30"
              d="M0 10 L 100 10"
              fill="none"
              stroke="#2170e4"
              strokeDasharray="4"
              strokeWidth="2"
            />
          </svg>
        </div>
        <GhostIcon name="school" />
      </article>

      {/* Total Sections */}
      <article className={cardClass}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary">
            <MaterialIcon name="grid_view" size="lg" />
          </div>
          <TrendChip variant="optimal" label="Optimal" />
        </div>
        <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Total Sections</h3>
        <div className="flex items-baseline gap-2">
          <p className="font-display-lg text-[32px] text-on-surface font-bold">{metrics.totalSections}</p>
          <p className="text-on-surface-variant text-body-sm">Batches</p>
        </div>
        <div className="mt-4 flex gap-1 items-end h-12">
          {[40, 60, 50, 80, 40, 70, 60, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-secondary/10 rounded-t-sm"
              style={{ height: `${h}%`, opacity: 0.1 + (i % 4) * 0.1 }}
            />
          ))}
        </div>
        <GhostIcon name="grid_view" />
      </article>

      {/* Average Presence */}
      <article className={cardClass}>
        <div className="mb-4">
          <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Average Presence</h3>
          <div className="flex items-baseline justify-between">
            <p className="font-display-lg text-[32px] text-on-surface font-bold">{metrics.averagePresence}%</p>
            <span className="text-green-600 font-bold text-sm">+2.4% vs LW</span>
          </div>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-3 mb-2">
          <div
            className="bg-secondary h-full rounded-full transition-all duration-1000"
            style={{ width: `${metrics.averagePresence}%` }}
          />
        </div>
        <p className="text-body-sm text-on-surface-variant">Target threshold: 90.0%</p>
        <GhostIcon name="calendar_month" />
      </article>

      {/* Average Absence */}
      <article className={cardClass}>
        <div className="mb-4">
          <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Average Absence</h3>
          <div className="flex items-baseline justify-between">
            <p className="font-display-lg text-[32px] text-on-surface font-bold">{metrics.averageAbsence}%</p>
            <span className="text-error font-bold text-sm">-0.8% vs LW</span>
          </div>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-3 mb-2">
          <div
            className="bg-error h-full rounded-full transition-all duration-1000"
            style={{ width: `${metrics.averageAbsence}%` }}
          />
        </div>
        <p className="text-body-sm text-on-surface-variant">Reduction trend active.</p>
        <GhostIcon name="event_busy" />
      </article>

      {/* Teachers Assigned — highlighted */}
      <article className={`${cardClass} bg-secondary text-on-secondary [&_.text-outline]:text-white/60 [&_.text-on-surface]:text-white [&_.text-on-surface-variant]:text-white/70`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
            <MaterialIcon name="assignment_ind" size="lg" />
          </div>
        </div>
        <h3 className="text-label-md text-outline uppercase tracking-wider mb-1">Teachers Assigned</h3>
        <div className="flex items-baseline gap-2">
          <p className="font-display-lg text-[32px] font-bold">{metrics.teachersAssigned}</p>
          <p className="text-body-sm opacity-70">Out of {metrics.totalTeachers} total</p>
        </div>
        <div className="mt-4 flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-white/20 border-2 border-secondary flex items-center justify-center text-[10px] font-bold"
            >
              {i < 4 ? '' : `+${Math.max(0, metrics.teachersAssigned - 3)}`}
            </div>
          ))}
        </div>
        <GhostIcon name="assignment_ind" className="text-white opacity-10" />
      </article>
    </div>
  );
}
