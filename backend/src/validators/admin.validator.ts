import { z } from 'zod';

export const createStudentSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  userId: z.string().min(3, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z.string().min(2, 'Roll number is required'),
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.coerce.number().int().min(1).max(8),
  section: z.enum(['A', 'B', 'C', 'D']),
  phone: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  userId: z.string().min(3, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeId: z.string().min(2, 'Employee ID is required'),
  departments: z.array(z.string().min(1)).min(1, 'At least one department is required'),
  subjects: z.array(z.string().min(1)).min(1, 'At least one subject is required'),
  phone: z.string().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
