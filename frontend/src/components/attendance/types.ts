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
