import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherProfile extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  departments: mongoose.Types.ObjectId[];
  subjects: mongoose.Types.ObjectId[];
  phone?: string;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    phone: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITeacherProfile>('TeacherProfile', TeacherProfileSchema);
