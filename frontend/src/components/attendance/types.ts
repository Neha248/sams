export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceStudent {
  studentId: string;
  universityRoll: string;
  classRoll: string;
  studentName: string;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface AttendanceChartSegment {
  name: string;
  value: number;
  color: string;
}

export interface SubjectWiseAttendanceRow {
  _id?: string;
  subjectName?: string;
  subjectCode?: string;
  present?: number;
  total?: number;
  absent?: number;
  late?: number;
  percentage?: number;
  presentPct?: number;
  absentPct?: number;
  latePct?: number;
  isSafe?: boolean;
  lateAsAbsent?: number;
  effectiveAbsent?: number;
  remainingLate?: number;
  subjectId?: string;
  classesNeeded?: number;
  upcomingClassesNextWeek?: number;
  canReachSafeZone?: boolean;
  suggestion?: string;
}

export interface SubjectSafeSummary {
  totalSubjects: number;
  safeSubjects: number;
  unsafeSubjects: SubjectWiseAttendanceRow[];
}
