import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  priority: 'normal' | 'important' | 'urgent';
  targetType: 'all' | 'department' | 'section' | 'student' | 'teacher';
  targetId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  scheduledAt?: Date;
  sentAt?: Date;
  isDraft: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    targetType: {
      type: String,
      enum: ['all', 'department', 'section', 'student', 'teacher'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    isDraft: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
