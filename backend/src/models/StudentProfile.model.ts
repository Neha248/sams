import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  rollNumber: string;
  departmentId: mongoose.Types.ObjectId;
  semester: number;
  section: string;
  phone?: string;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, required: true, uppercase: true },
    phone: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
