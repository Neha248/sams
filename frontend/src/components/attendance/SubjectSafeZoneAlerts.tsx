import type { SubjectWiseAttendanceRow } from './types';

type SubjectSafeZoneAlertsProps = {
  unsafeSubjects: SubjectWiseAttendanceRow[];
};

const SubjectSafeZoneAlerts = ({ unsafeSubjects }: SubjectSafeZoneAlertsProps) => {
  if (!unsafeSubjects.length) return null;

  return (
    <div
      className="rounded-xl border border-neon-crimson/40 bg-neon-crimson/10 px-5 py-4 space-y-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
          ⚠️
        </span>
        <div>
          <h3 className="text-neon-crimson font-bold text-sm uppercase tracking-wide">
            Attendance alert — below safe zone (75%)
          </h3>
          <p className="text-slate-300 text-sm mt-1">
            {unsafeSubjects.length} subject(s) are under 75%. Each subject must be at or above 75% to
            be in the safe zone.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {unsafeSubjects.map((subject) => (
          <li
            key={subject.subjectId || `${subject.subjectCode}-${subject.subjectName}`}
            className="rounded-lg border border-white/10 bg-navy-900/60 px-4 py-3 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">
                {subject.subjectName}{' '}
                <span className="text-slate-400 font-normal">({subject.subjectCode})</span>
              </p>
              <span className="text-neon-crimson font-bold text-sm">{subject.percentage}%</span>
            </div>
            <p className="text-xs text-slate-400">
              Present {subject.present ?? 0} / {subject.total ?? 0} · Absent {subject.absent ?? 0} · Late{' '}
              {subject.late ?? 0} (2 late = 1 absent) · Eff. absent{' '}
              <span className="text-neon-crimson">{subject.effectiveAbsent ?? 0}</span> · Need{' '}
              <span className="text-white font-medium">{subject.classesNeeded ?? 0}</span> present ·{' '}
              <span className="text-amber-400">{subject.upcomingClassesNextWeek ?? 0}</span> classes next 7
              days
            </p>
            <p
              className={`text-sm leading-relaxed ${
                subject.canReachSafeZone ? 'text-neon-blue' : 'text-amber-300'
              }`}
            >
              💡 {subject.suggestion}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubjectSafeZoneAlerts;
