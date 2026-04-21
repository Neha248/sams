import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  departmentId: mongoose.Types.ObjectId;
  semester: number;
  credits: number;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.model<ISubject>('Subject', SubjectSchema);
