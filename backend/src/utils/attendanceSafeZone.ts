import type { WeekDay } from '../models/Timetable.model';

export const SAFE_ZONE_THRESHOLD = 75;
export const LATE_TO_ABSENT_RATIO = 2;

const WEEKDAYS = new Set<WeekDay>([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]);

export type AttendanceCounts = {
  present: number;
  absent: number;
  late: number;
  total: number;
};

export type AttendanceWithLateRule = AttendanceCounts & {
  lateAsAbsent: number;
  effectiveAbsent: number;
  remainingLate: number;
  percentage: number;
};

/** 2 late marks count as 1 absent for reporting and policy display */
export function applyLateToAbsentRule(counts: AttendanceCounts): AttendanceWithLateRule {
  const { present, absent, late, total } = counts;
  const lateAsAbsent = Math.floor(late / LATE_TO_ABSENT_RATIO);
  const effectiveAbsent = absent + lateAsAbsent;
  const remainingLate = late % LATE_TO_ABSENT_RATIO;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    present,
    absent,
    late,
    total,
    lateAsAbsent,
    effectiveAbsent,
    remainingLate,
    percentage,
  };
}

/** Present classes needed so (present + x) / (total + x) >= 75% */
export function classesNeededForSafeZone(present: number, total: number): number {
  if (total <= 0 || present < 0) return 0;
  if ((present / total) * 100 >= SAFE_ZONE_THRESHOLD) return 0;
  return Math.ceil((SAFE_ZONE_THRESHOLD / 100 * total - present) / (1 - SAFE_ZONE_THRESHOLD / 100));
}

export function countUpcomingClassesBySubject(
  timetableSlots: Array<{ day: WeekDay; subjectId: { toString(): string } }>,
  daysAhead = 7
): Map<string, number> {
  const counts = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }) as WeekDay;
    if (!WEEKDAYS.has(dayName)) continue;

    for (const slot of timetableSlots) {
      if (slot.day === dayName) {
        const subjectKey = slot.subjectId.toString();
        counts.set(subjectKey, (counts.get(subjectKey) || 0) + 1);
      }
    }
  }

  return counts;
}

export function buildSafeZoneSuggestion(
  subjectName: string,
  classesNeeded: number,
  upcomingClassesNextWeek: number
): string {
  if (classesNeeded <= 0) {
    return `${subjectName} is already in the safe zone.`;
  }

  if (upcomingClassesNextWeek <= 0) {
    return `No classes for ${subjectName} are scheduled in the next 7 days. Check your timetable or contact your teacher.`;
  }

  if (upcomingClassesNextWeek >= classesNeeded) {
    return `Attend at least ${classesNeeded} of the ${upcomingClassesNextWeek} scheduled class(es) for ${subjectName} this week (mark present) to reach the safe zone (75%).`;
  }

  return `You need ${classesNeeded} more present class(es) for ${subjectName}, but only ${upcomingClassesNextWeek} scheduled this week. Attend all of them and you will still need ${classesNeeded - upcomingClassesNextWeek} more present class(es) later.`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
