import { z } from 'zod';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTimetableSchema = z.object({
  departmentId: z.string().min(1),
  semester: z.number().int().min(1).max(8),
  section: z.string().min(1),
  day: z.enum(days),
  startTime: z.string().regex(timeRegex, 'Invalid time format HH:MM'),
  endTime: z.string().regex(timeRegex, 'Invalid time format HH:MM'),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  roomNo: z.string().min(1),
});

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;

export const updateTimetableSchema = createTimetableSchema.partial();

export const publishTimetableSchema = z.object({
  departmentId: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  section: z.string().min(1),
});
