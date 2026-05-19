export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface FilterOption {
  id: string;
  name: string;
}

export interface AnalyticsRecord {
  universityRoll: string;
  classRoll: string;
  studentName: string;
  status: AttendanceStatus;
  date: string;
}

export interface ChartSegment {
  name: string;
  value: number;
  color: string;
}

export interface TrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
}
