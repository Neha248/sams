import mongoose, { Document, Schema } from 'mongoose';

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ITimetable extends Document {
  departmentId: mongoose.Types.ObjectId;
  semester: number;
  section: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  roomNo: string;
  isPublished: boolean;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true, uppercase: true },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomNo: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITimetable>('Timetable', TimetableSchema);
