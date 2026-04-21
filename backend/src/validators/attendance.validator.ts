import { z } from 'zod';

export const markAttendanceSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.number().int().min(1).max(8),
  section: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  timetableId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  students: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['present', 'absent', 'late']),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one student required'),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
