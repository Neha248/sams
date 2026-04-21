import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  timetableId?: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timetableId: { type: Schema.Types.ObjectId, ref: 'Timetable' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate attendance record per student per subject per date
AttendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
