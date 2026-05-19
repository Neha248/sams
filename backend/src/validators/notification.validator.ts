import { z } from 'zod';

export const sendNotificationSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
    targetType: z.enum(['all', 'student', 'teacher']),
    targetId: z.string().optional(),
  })
  .refine((data) => data.targetType === 'all' || Boolean(data.targetId?.trim()), {
    message: 'Select a recipient for individual notifications',
    path: ['targetId'],
  });

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
