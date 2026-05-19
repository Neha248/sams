/**
 * Attendance Service Placeholder
 */

export interface AttendanceStudentResponse {
  studentId: string;
  universityRoll: string;
  classRoll: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
}

export const getAttendanceStudentListService = async (filters: any): Promise<AttendanceStudentResponse[]> => {
  // TODO connect student collection
  // TODO connect attendance collection
  
  console.log('[Attendance Service] Resolving roster for filters:', filters);

  // Static Roster Placeholder
  return [
    {
      studentId: "stud-1",
      universityRoll: "220101903001",
      classRoll: "CS-01",
      studentName: "Kenji Sato",
      status: "present"
    },
    {
      studentId: "stud-2",
      universityRoll: "220101903002",
      classRoll: "CS-02",
      studentName: "Yuki Tanaka",
      status: "present"
    },
    {
      studentId: "stud-3",
      universityRoll: "220101903003",
      classRoll: "CS-03",
      studentName: "Hiroshi Nakamura",
      status: "present"
    },
    {
      studentId: "stud-4",
      universityRoll: "220101903004",
      classRoll: "CS-04",
      studentName: "Sora Takahashi",
      status: "present"
    },
    {
      studentId: "stud-5",
      universityRoll: "220101903005",
      classRoll: "CS-05",
      studentName: "Rei Watanabe",
      status: "present"
    }
  ];
};

export const submitAttendanceService = async (payload: any) => {
  // TODO persist attendance
  console.log('[Attendance Service] Received attendance submission:', payload);
  return {
    success: true,
    message: 'Attendance synchronization protocol initiated.',
    batchId: `BATCH-${Math.floor(Math.random() * 1000000)}`
  };
};
